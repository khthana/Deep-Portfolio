export type AcceptInviteBody = {
  token: string;
  type: "learning-activity" | "activity";
  action: "ACCEPT" | "REJECTED";
};

export type ValidateInvite = {
  token: string;
  type: "learning-activity" | "activity";
};
