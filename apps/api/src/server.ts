import app from "./app";
import { env } from "./config/env";
import { setupAssignTasksCron } from "./jobs/assign-tasks.job";

/**
 * Process entry point: everything that makes this a running server rather than
 * a request handler. Keep side effects here, not in app.ts.
 */
setupAssignTasksCron();

app.listen(env.PORT, () => {
  console.log(`Server is running at http://localhost:${env.PORT}`);
});
