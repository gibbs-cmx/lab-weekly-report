import { describe, expect, it } from "vitest";

import { encodeUserInfo } from "./resolve-runtime-secrets";

describe("encodeUserInfo", () => {
  it("unreserved 문자는 그대로", () => {
    expect(encodeUserInfo("wr_admin-1.0~")).toBe("wr_admin-1.0~");
  });

  it("URL 경계를 깨는 문자를 모두 인코딩 (encodeURIComponent 가 남기는 !'()* 포함)", () => {
    expect(encodeUserInfo("p@ss:w/rd?#")).toBe("p%40ss%3Aw%2Frd%3F%23");
    expect(encodeUserInfo("a!b'c(d)e*f=g")).toBe("a%21b%27c%28d%29e%2Af%3Dg");
  });

  it("멀티바이트 문자는 UTF-8 바이트 단위로 인코딩", () => {
    expect(encodeUserInfo("가")).toBe("%EA%B0%80");
  });
});
