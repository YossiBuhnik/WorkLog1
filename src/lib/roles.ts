// Office staff are also regular employees: they submit their own shifts, vacations and reports.
export const canSubmitRequests = (roles?: string[] | null) =>
  !!roles && (roles.includes('employee') || roles.includes('office'));
