import { ensureMigrated } from "../src/lib/db/migrate";

ensureMigrated();
console.log("migrations applied");
