// ActivityMappingDetailResp and LearningActivityDetail used to be declared
// here. They moved to @deep-portfolio/api-types (#68) as `CLOMappedActivity`
// and `CLOMappedLearningActivity` — import them from there. Both copies had
// drifted: four dates typed `Date` where JSON carries strings, three keys the
// endpoints never send (`sequence_order`, `score_category`, `week_no`), and
// `expected_level`, `weight` and `level_no` marked optional over columns that
// are always sent. The endpoints narrowed to what the cards read in the same
// pass — see ADR-0047.
//
// What stays is what the two add-forms collect and what the two POSTs are sent.
// The responses those POSTs answer are `ActivityCLOMapping` and
// `LearningActivityCLOMapping` in the package; nothing here reads them beyond
// checking that a body arrived.

export type ActivityFormType = {
  activity: string;
  weight: number;
};

export type CreateActivityCLOMappingBodyReq = {
  activity_id: number;
  clo_id: number;
  weight: number;
};

//----------------------------------------------------------

export type LearningActivityFormType = {
  learning_activity: string;
};

export type CreateLearningActivityCLOMappingBodyReq = {
  learning_activity_id: number;
  clo_id: number;
};
