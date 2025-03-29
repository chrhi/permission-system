import { AccessControl, PolicyBuilder } from "../src";

type User = {
  id: string;
  roles: string[];
  blockedBy?: string[];
};

type Article = {
  id: string;
  authorId: string;
  content: string;
};

describe("AccessControl", () => {
  const policy = new PolicyBuilder<User>()
    .forRole("admin")
    .onResource<Article>("article")
    .can({
      create: true,
      delete: true,
    })
    .forRole("author")
    .onResource<Article>("article")
    .can({
      create: true,
      delete: (user, article) => user.id === article?.authorId,
    })
    .build();

  const acl = new AccessControl<User>(policy);

  test("admin can delete any article", () => {
    const admin: User = { id: "1", roles: ["admin"] };
    const article = { id: "a1", authorId: "2", content: "test" };
    expect(acl.hasPermission(admin, "article", "delete", article)).toBe(true);
  });

  test("author can delete own article", () => {
    const author: User = { id: "1", roles: ["author"] };
    const article = { id: "a1", authorId: "1", content: "test" };
    expect(acl.hasPermission(author, "article", "delete", article)).toBe(true);
  });
});
