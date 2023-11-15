const uploadButton = "[data-cy=upload-button]";
const fileInput = "[data-cy=file-input]";
const submitButton = "[data-cy=submit-button]";
const captureButton = "[data-cy=capture-button]";
const cameraInput = "[data-cy=camera-input]";
const topicInput = "[data-cy=topic-input]";
const questionList = "[data-cy=question-list]";
const textbookImage = "textbook.jpg";
const topic = "Physics";

/**
 the application is a react-based web tool designed to enhance learning.
 users can upload a picture of a textbook page or capture one using their camera.
 the user can specify a topic of interest.
 the backend uses ocr to extract text from the image.
 it generates a list of questions that cover the same material as the textbook but in the context of the user's chosen topic.
 this allows users to learn textbook content in a more engaging and personalized way.
 <scxml initial="idle">
  <!-- The application starts in an idle state -->
  <state id="idle">
    <!-- When a user uploads or captures an image, the application moves to the 'processingImage' state -->
    <transition event="uploadImage" target="processingImage"/>
    <!-- When a user specifies a topic of interest, the application moves to the 'topicSpecified' state -->
    <transition event="specifyTopic" target="topicSpecified"/>
  </state>

  <!-- After an image is uploaded -->
  <state id="processingImage">
    <!-- If OCR is successful, the application moves to the 'ocrComplete' state -->
    <transition event="ocrComplete" target="ocrComplete"/>
    <!-- If OCR fails, the application moves back to the 'idle' state -->
    <transition event="ocrFailed" target="idle"/>
  </state>

  <!-- After a topic is specified -->
  <state id="topicSpecified">
    <!-- If a user uploads or captures an image, the application moves to the 'processingImage' state -->
    <transition event="uploadImage" target="processingImage"/>
  </state>
  <!-- After OCR is complete -->
  <state id="ocrComplete">
    <!-- The application stays in this state until a new image is uploaded or a new topic is specified -->
    <transition event="uploadImage" target="processingImage"/> 
    <transition event="specifyTopic" target="topicSpecified"/>
  </state>

  <!-- Parallel state for OCR complete and topic specified -->
  <parallel id="readyForGeneration">
    <state id="ocrComplete"/>
    <state id="topicSpecified"/>
    <!-- When both OCR is complete and a topic is specified, the application moves to the 'generating' state -->
    <transition event="generateQuestions" target="generating"/>
  </parallel>

  <!-- While the questions are being generated -->
  <state id="generating">
    <!-- If question generation is successful, the application moves to the 'questionsGenerated' state -->
    <transition event="questionsGenerated" target="questionsGenerated"/>
    <!-- If question generation fails, the application moves back to the 'idle' state -->
    <transition event="questionsFailed" target="idle"/>
  </state>

  <!-- After questions are generated -->
  <state id="questionsGenerated">
    <!-- The application stays in this state until a new image is uploaded or a new topic is specified -->
    <transition event="uploadImage" target="processingImage"/>
    <transition event="specifyTopic" target="topicSpecified"/>
  </state>
</scxml>
 */

// Test: User can upload a picture of a textbook page
it("allows user to upload a picture of a textbook page", () => {
  cy.get(uploadButton).click();
  cy.get(fileInput).attachFile(textbookImage);
  cy.get(submitButton).click();
  cy.contains("Upload successful");
});

// Test: User can capture a picture using their camera
it("allows user to capture a picture using their camera", () => {
  cy.get(captureButton).click();
  cy.get(cameraInput).trigger("start");
  cy.get(submitButton).click();
  cy.contains("Capture successful");
});

// Test: User can specify a topic of interest
it("allows user to specify a topic of interest", () => {
  cy.get(topicInput).type(topic);
  cy.get(submitButton).click();
  cy.contains(`Topic set to ${topic}`);
});

// Test: Backend uses OCR to extract text from the image
it("uses OCR to extract text from the image", () => {
  cy.get(uploadButton).click();
  cy.get(fileInput).attachFile(textbookImage);
  cy.get(submitButton).click();
  cy.contains("OCR processing complete");
});

// Test: Generates a list of questions in the context of the user's chosen topic
it("generates a list of questions in the context of the user's chosen topic", () => {
  cy.get(topicInput).type(topic);
  cy.get(submitButton).click();
  cy.get(uploadButton).click();
  cy.get(fileInput).attachFile(textbookImage);
  cy.get(submitButton).click();
  cy.contains(`Questions generated for topic: ${topic}`);
});

// Test: Allows users to learn textbook content in a more engaging and personalized way
it("allows users to learn textbook content in a more engaging and personalized way", () => {
  cy.get(topicInput).type(topic);
  cy.get(submitButton).click();
  cy.get(uploadButton).click();
  cy.get(fileInput).attachFile(textbookImage);
  cy.get(submitButton).click();
  cy.get(questionList).should("contain", topic);
});
