import type {
  RubricDetailForm,
  RubricLevel,
} from "../types/rubric-type.type";

/** One criterion in the shape `POST`/`PUT /activity` is sent it. */
export type RubricPayload = {
  id?: number;
  criteria: string;
  weight: number;
  levels: RubricLevel[];
};

/**
 * The rubric the form holds, as the API is sent it.
 *
 * The form carries bookkeeping the API has no use for — which shared rubric a
 * row was ticked from, so the modal can untick it again — and that has always
 * been stripped here. What is new is the `id`.
 *
 * A criterion the edit form was given comes back carrying the id it arrived
 * with, and that is what tells `PUT /activity` it is the criterion already
 * there rather than a new one. Sent without it, the endpoint writes the rubric
 * afresh, and the marks students were given against the old criteria go with
 * them — which is what every save did before #25. A criterion the teacher added
 * has no id to send, and must not be given one; the field is left off rather
 * than sent empty.
 *
 * Creating an activity goes through the same function: there is no id to carry
 * on that path, and nothing to say if there were.
 */
export const toRubricPayload = (rubrics: RubricDetailForm[]): RubricPayload[] =>
  rubrics.map((rubric) => ({
    ...(rubric.id === undefined ? {} : { id: rubric.id }),
    criteria: rubric.criteria,
    weight: rubric.weight,
    levels: rubric.levels,
  }));
