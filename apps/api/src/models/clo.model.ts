/**
 * What the CLO endpoints accept is now stated once, by the schemas that check
 * it. Re-exported from here so the services keep importing their request types
 * from the model layer, and so the two can no longer drift: the old hand-written
 * copies said `plo_id: number` where the column is nullable and the service
 * already passed it through undefined.
 */
export type { AddCLOBody, UpdateCLOBody } from "../validation/course.schema";
