import React, { useRef, useState } from "react";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { ActionFunctionArgs } from "@remix-run/node";
import { askLanguageModelShape } from "~/ChatGPTUtils";


function reply({replyText}: {replyText: string}): string {
  return replyText;
}

export interface ReturnedDataProps {
  message?: string;
  reply: string;
  error?: string;
}

export async function action({
  request,
}: ActionFunctionArgs): Promise<ReturnedDataProps> {
  const body = await request.formData();
  let message = body.get("message") as string;

  try {
    const response: string = await askLanguageModelShape(
      message,
      {
        name: "reply",
        description: "Replies to the message",
        parameters: {
          type: "object",
          properties: {
            replyText: {
              type: "string",
              description: "The reply to the message",
            },
          },
          required: ["replyText"],
        },
      },
      reply
    );
    return {
      message: body.get("message") as string,
      reply: response as string,
    };
  } catch (error: any) {
    console.log(error);
    return {
      message: body.get("message") as string,
      reply: "",
      error: error.message || "Something went wrong! Please try again.",
    };
  }
}

export default function IndexPage() {
  const data = useActionData<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();
  const submit = useSubmit();
  const [userInput, setUserInput] = useState<string>("");

  const isSubmitting = navigation.state === "submitting";

  const handleFormSubmit = async (
    event: Pick<Event, "preventDefault" | "stopPropagation">
  ) => {
    const formData = new FormData();
    formData.set("message", userInput);
    submit(formData, {
      method: "POST",
    });
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <main className="flex flex-col h-screen w-screen bg-gray-100 p-4">
      <Form
        aria-disabled={isSubmitting}
        method="post"
        ref={formRef}
        onSubmit={handleFormSubmit}
        replace
        className="flex flex-col justify-between h-full"
      >
        <textarea
          id="message"
          aria-disabled={isSubmitting}
          className="input-box flex-grow h-full p-2 rounded-md border-2 border-gray-300 mr-2"
          placeholder="Type your message to ChatGPT here..."
          name="message"
          required
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
          }}
          disabled={isSubmitting}
          style={{maxHeight: '200px', textAlign: 'left', verticalAlign: 'top'}}
        />
        <button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2">
          Submit
        </button>
      </Form>
      <div className="bg-white rounded-md shadow-lg mt-4 p-4">
        {data?.reply || data?.error || "// This is where your ChatGPT response will be displayed"}
      </div>
    </main>
  );
}

