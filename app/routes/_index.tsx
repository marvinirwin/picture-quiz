import fs from "fs";

import { ActionFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useMachine } from "@xstate/react";
import React, { useEffect, useMemo, useState } from "react";
import Webcam from "react-webcam";
import { createMachine } from "xstate";

import { askLanguageModelShape } from "~/ChatGPTUtils";

import { getVision } from "../components/getVision.server";
import {
  checkIdiomaticChinese,
  generateQuestionsFromTextbook,
} from "../components/prompts";

export interface ReturnedDataProps {
  answeredQuestionResponse?: {
    question: string;
    answer: string;
    response: string;
  };
  responseQuestions?: string[];
  error?: string;
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

export function reply({ replyText }: { replyText: string }): string {
  return replyText;
}
function setQuestions({ questions }: { questions: string[] }): string[] {
  return questions;
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
  const vision = getVision();
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
        response,
      },
    };
  } else if (type === "generateQuestions") {
    console.log("Entered generateQuestions block");
    const imageString = body.get("image") as string;
    const imageBuffer = Buffer.from(imageString, "base64");
    fs.writeFileSync("test.png", imageBuffer);
    console.log("Image buffer created");
    try {
      console.log("Attempting text detection");
      const [result] = await vision.textDetection(imageBuffer);
      const error = result.error;
      console.log(error);
      if (error) {
        console.log("Text detection error: ", error.message);
        return {
          error: error.message || "Unknown text detection error",
        };
      }
      console.log("Text detection successful");
      const detection = result.textAnnotations?.[0];
      if (!detection) {
        console.log("Detection object is empty");
        return {
          error: `Detection object is empty`,
        };
      }
      console.log("Attempting to generate questions");
      const response: string[] = await askLanguageModelShape<string[]>(
        generateQuestionsFromTextbook({
          ocrText: detection.description || "",
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
        setQuestions,
      );
      console.log("Questions generated successfully");
      return {
        responseQuestions: response as string[],
      };
    } catch (error: any) {
      console.log("Error occurred: ", error);
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
  const createFormData = (data: Record<string, any>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.set(key, value);
    });
    return formData;
  };
  // The application is a react-based web tool designed to enhance learning.
  // Users can upload a picture of a textbook page or capture one using their camera.
  // The user can specify a topic of interest.
  // The backend uses OCR to extract text from the image.
  // It generates a list of questions that cover the same material as the textbook but in the context of the user's chosen topic.
  // This allows users to learn textbook content in a more engaging and personalized way.
  const machine = useMemo(
    () =>
      createMachine({
        id: "learningApp",
        initial: "idle",
        states: {
          // The application starts in an idle state
          idle: {
            on: {
              // When a user specifies a topic of interest, the application moves to the 'topicSpecified' state
              SPECIFY_TOPIC: "topicSpecified",
            },
          },
          // After a topic is specified
          topicSpecified: {
            on: {
              // If a user uploads or captures an image, the application moves to the 'questionGenerationInProgress' state
              SEND_IMAGE_AND_TOPIC: {
                target: "questionGenerationInProgress",
              },
            },
          },
          // After an image is uploaded and topic is specified
          questionGenerationInProgress: {
            on: {
              // If question generation is successful, the application moves to the 'questionsGenerated' state
              QUESTIONS_GENERATED: "questionsGenerated",
              // If question generation fails, the application moves back to the 'idle' state
              QUESTIONS_FAILED: "idle",
            },
          },
          // After questions are generated
          questionsGenerated: {
            on: {
              // The application stays in this state until a new image is uploaded and a new topic is specified
              SEND_IMAGE_AND_TOPIC: {
                target: "questionGenerationInProgress",
              },
            },
          },
        },
      }),
    [],
  );
  const [state, send] = useMachine(machine);

  const [topic, setTopic] = useState<string>("War");
  const [image, setImage] = useState<string>("");
  const webcamRef = React.useRef<Webcam>(null);
  const data = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  useEffect(() => {
    if (topic) {
      send({ type: "SPECIFY_TOPIC" });
    }
    // TODO add a way to make the topic go back to unspecified later.  Need to modify state machine
  }, [topic, send]);

  useEffect(() => {
    if (data?.error) {
      send({ type: "ERROR", payload: data.error });
    } else if (data?.answeredQuestionResponse) {
      send({
        type: "ANSWERED_QUESTION",
        payload: data.answeredQuestionResponse,
      });
    } else if (data?.responseQuestions) {
      send({ type: "QUESTIONS_GENERATED", payload: data.responseQuestions });
    }
  }, [data, send]);

  const isSubmitting = navigation.state === "submitting";

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
    }
  }, [webcamRef]);

  useEffect(() => {
    if (state.value === "topicSpecified" && image && topic) {
      submit(
        createFormData({
          type: "generateQuestions",
          image: image,
          topic: topic,
        }),
        {
          method: "POST",
        },
      );
    }
  }, [image, topic, state, submit]);

  return (
    <main className="flex flex-col h-screen w-screen bg-gray-100 p-4">
      <Webcam
        data-cy="camera-input"
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
      />
      <button data-cy="capture-button" onClick={capture}>
        Capture photo
      </button>
      <Form
        data-cy="upload-button"
        aria-disabled={isSubmitting}
        method="post"
        replace
        className="flex flex-col justify-between h-full"
      >
        <textarea
          id="message"
          data-cy="topic-input"
          aria-disabled={isSubmitting}
          className="input-box flex-grow h-full p-2 rounded-md border-2 border-gray-300 mr-2"
          placeholder="Type your message to ChatGPT here..."
          name="message"
          required
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
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
          data-cy="submit-button"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
        >
          Submit
        </button>
      </Form>
      <div
        className="bg-white rounded-md shadow-lg mt-4 p-4"
        data-cy="question-list"
      >
        {data?.responseQuestions ||
          data?.error ||
          "// This is where your ChatGPT response will be displayed"}
      </div>
    </main>
  );
}
