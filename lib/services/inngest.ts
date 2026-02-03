import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "leadflow-app" });

/**
 * Event: campaign/email.staggered_send
 * Used to trigger a send with exponential backoff or scheduling.
 */
export const triggerEmailSend = async (data: {
  leadId: string;
  campaignId: string;
  stepIdx: number;
}) => {
  await inngest.send({
    name: "campaign/email.staggered_send",
    data,
  });
};
