import React, { useRef, useState } from "react";
import { Vision } from "@google-cloud/vision";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { ActionFunctionArgs } from "@remix-run/node";
import { askLanguageModelShape } from "~/ChatGPTUtils";
import {
  checkIdiomaticChinese,
  generateQuestionsFromTextbook,
} from "../components/prompts";
import Webcam from "react-webcam";

const vision = Vision.ImageAnnotatorClient.fromJSON(
  JSON.parse(process.env.GOOGLE_CREDENTIALS as string)
);

function reply({ replyText }: { replyText: string }): string {
  return replyText;
}
function setQuestions({ questions }: { questions: string[] }): string[] {
  return questions;
}

export interface ReturnedDataProps {
  answeredQuestionResponse?: { question: string; answer: string; response: string };
  responseQuestions?: string[];
  error?: string;
}

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
    reply
  );
  return response as string;
}

export interface CheckAnswerBody {
  type: "checkAnswer";
  question: string;
  answer: string;
}

export interface GenerateQuestionsBody {
  type: "generateQuestions";
  image: Blob;
}

/**
 * This function is an action handler for the form submission.
 * It takes in a request object as a parameter and returns a Promise of ReturnedDataProps.
 * The function first retrieves the form data from the request and checks the type of the request.
 * If the type is "checkAnswer", it retrieves the question and answer from the form data and checks if the answer is idiomatic Chinese.
 * If the type is "generateQuestions", it retrieves the image from the form data, runs text detection on the image, and generates questions from the detected text.
 * If the type is neither "checkAnswer" nor "generateQuestions", it returns an error message.
 * @param {ActionFunctionArgs} request - The request object containing the form data.
 * @returns {Promise<ReturnedDataProps>} - A Promise that resolves to an object containing the message, reply, and possible error.
 */
export async function action({
  request,
}: ActionFunctionArgs): Promise<ReturnedDataProps> {
  const body = await request.formData();
  const type = body.get("type") as string;

  if (type === "checkAnswer") {
    const question = body.get("question") as string;
    const answer = body.get("answer") as string;
    const response = await checkIdiomaticChinese(question, answer);
    return {
      answeredQuestionResponse: {
        question,
        answer,
        response
      },
    };
  } else if (type === "generateQuestions") {
    const image = body.get("image") as Blob;
    try {
      const [result] = await vision.textDetection(image);
      const detections = result.textAnnotations;
      const response: string[] = await askLanguageModelShape<string[]>(
        generateQuestionsFromTextbook({
          ocrText: detections[0].description,
          knownWords: ["All HSK3 words"],
          targetSubject: "War",
        }),
        {
          name: "setQuestions",
          description: "Sets the generated questions",
          parameters: {
            questions: {
              type: "array",
              description:
                "The list of questions generated based off the input",
              items: {
                type: "string",
              },
            },
          },
          required: ["questions"],
        },
        setQuestions
      );
      return {
        responseQuestions: response as string[],
      };
    } catch (error: any) {
      console.log(error);
      return {
        error: error.message || "Something went wrong! Please try again.",
      };
    }
  }
  return {
    error: `Unknown submit type ${type}`,
  };
}

export default function IndexPage() {
  const data = useActionData<typeof action>();
  const formRef = useRef<HTMLFormElement>(null);
  const navigation = useNavigation();
  const submit = useSubmit();
  const [userInput, setUserInput] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const webcamRef = React.useRef<Webcam>(null);
  console.log(data);

  const isSubmitting = navigation.state === "submitting";

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFormSubmit = async (
    event: Pick<Event, "preventDefault" | "stopPropagation">
  ) => {
    const formData = new FormData();
    formData.set("message", userInput);
    formData.set("image", image);
    submit(formData, {
      method: "POST",
    });
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <main className="flex flex-col h-screen w-screen bg-gray-100 p-4">
      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
      <button onClick={capture}>Capture photo</button>
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
          style={{
            maxHeight: "200px",
            textAlign: "left",
            verticalAlign: "top",
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
        >
          Submit
        </button>
      </Form>
      <div className="bg-white rounded-md shadow-lg mt-4 p-4">
        {data?.responseQuestions ||
          data?.error ||
          "// This is where your ChatGPT response will be displayed"}
      </div>
    </main>
  );
}
