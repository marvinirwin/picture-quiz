import { askLanguageModelShape } from "~/ChatGPTUtils";

import { reply } from "../routes/_index";

import { checkIdiomaticChinese } from "./prompts";


async function checkAnswer({
  question,
  answer,
  knownWords,
}: {
  question: string;
  answer: string;
  knownWords: string[];
}): Promise<string> {
  const response = await askLanguageModelShape(
    checkIdiomaticChinese(question, answer),
    {
      name: "reply",
      description: "Replies to the message",
      parameters: {
        replyText: {
          type: "string",
          description: "The reply to the message",
        },
      },
      required: ["replyText"],
    },
    reply,
  );
  return response as string;
}
