import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const STATE_COOKIE = "pepito_oauth_state";

/** Protection CSRF standard du flux OAuth : state aléatoire posé en cookie avant redirection, vérifié au retour. */
export async function createOAuthState(): Promise<string> {
  const state = randomUUID();
  const store = await cookies();
  store.set(STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return state;
}

export async function verifyAndClearOAuthState(receivedState: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  return Boolean(expected) && expected === receivedState;
}
