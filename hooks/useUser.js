import { useDB } from "./useDB.js";

const db = useDB();
const user = db.user().recall({ sessionStorage: true }, console.info);

db.on("auth", async (event) => {
  const alias = await user.get("alias");
  console.log(`signed in as ${alias}`);

  if (!(await db.user().get("profile"))) {
    console.log("setting profile");
    const profile = {
      alias,
      avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${alias}`,
      createdAt: new Date().toISOString(),
    };
    user.get("profile").put(profile);
  }
  user.get("connected").set({ date: new Date().toISOString() });

  db.get("users").set(user);
});

function login(alias, password) {
  const auth = user.auth(alias, password, console.info);
  console.log("Logininini", auth);
}

export function useUser() {
  if (!user.is) {
    const alias = crypto.randomUUID();
    const password = "cacapisculo";

    user.create(alias, password, (...args) => {
      console.log("creating user", ...args);

      login(alias, password);
    });
  }

  return user;
}
