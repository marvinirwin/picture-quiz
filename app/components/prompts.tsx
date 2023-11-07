/**
 The following are a list of Chinese words I need to learn. 
 Can you ask me a set of questions in which i have to use them to answer. 
 The theme of the questions is the classic story Journey to the West. 
 Try to have all the non new vocab words be HSK3, or at most HSK4.

 */
export function generateQuestionsWithNewVocab(newVocab: string[]): string {
  return `The following are a list of Chinese words I need to learn. 
  Can you ask me a set of questions in which i have to use them to answer. 
  The theme of the questions is the classic story Journey to the West. 
  Try to have all the non new vocab words be HSK3, or at most HSK4.
  New Vocabulary: ${newVocab.join(', ')}`;
}

export function generateQuestionsFromTextbook({ocrText, knownWords, targetSubject}: {ocrText: string, knownWords: string[], targetSubject: string}): string {
  return `The following text is the result of running OCR on a textbook page: ${ocrText}
  I know the following words: ${knownWords.join(', ')}
  Can you generate a list of questions from the textbook's text that teach me the same vocabulary/grammar, but make the questions about the ${targetSubject}? This subject is more interesting to me.`;
}



/**
 The following is question from a quiz.  
 I need to answer it in idiomatic Chinese, but I should only try to use HSK3 and HSK4 terms in my answer, 
 unless the specific term I need is higher level.
 Can you tell me if it's fully idiomatic and correct, or if there's anything I can improve?
 Don't tell me exactly what i should say, so that I have the opportunity to try to correct my sentence

 */
export function checkIdiomaticChinese(question: string, answer: string): string {
  return `The following is question from a quiz.  
  I need to answer it in idiomatic Chinese, but I should only try to use HSK3 and HSK4 terms in my answer, 
  unless the specific term I need is higher level.
  Can you tell me if it's fully idiomatic and correct, or if there's anything I can improve?
  Don't tell me exactly what i should say, so that I have the opportunity to try to correct my sentence
  Question: ${question}
  Answer: ${answer}`;
}

