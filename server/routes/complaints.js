import {
  assignComplaint, decideComplaint, setComplaintPriority, submitComplaint, updateComplaintStatus,
} from "../services/complaints.js";
import { requireUser } from "../services/errors.js";
import {
  complaintAssignInput, complaintDecisionInput, complaintInput, complaintPriorityInput, complaintStatusInput, parse,
} from "../services/validation.js";

const action = (app, schema, fn) => async (request) => {
  const user = requireUser(request);
  return { success: true, data: await fn(app.pool, request.params.id, parse(schema, request.body), user) };
};

export default async function complaintRoutes(app) {
  app.post("/", app.limit("submit"), async (request, reply) => {
    const user = requireUser(request);
    const data = await submitComplaint(app.pool, parse(complaintInput, request.body), user);
    return reply.code(201).send({ success: true, data });
  });
  app.post("/:id/assign", action(app, complaintAssignInput, assignComplaint));
  app.post("/:id/priority", action(app, complaintPriorityInput, setComplaintPriority));
  app.post("/:id/status", action(app, complaintStatusInput, updateComplaintStatus));
  app.post("/:id/decision", action(app, complaintDecisionInput, decideComplaint));
}
