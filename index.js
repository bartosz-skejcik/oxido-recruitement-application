import fs from "fs";
import readline from "readline";
import chalk from "chalk";

/**
 * @param {string} filePath
 *
 * @return { Promise<string> }
 */
async function writeToFile(filePath, data = "") {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err) => {
      if (err) {
        reject(err);
      }

      resolve("The file has been saved!");
    });
  });
}

/**
 * @returns { Promise<string> }
 */
async function getArticle() {
  const res = await fetch(
    "https://cdn.oxido.pl/hr/Zadanie%20dla%20JJunior%20AI%20Developera%20-%20tresc%20artykulu.txt",
    {
      headers: {
        "Content-Type": "text/plain",
      },
    },
  );

  const text = await res.text();

  return text;
}

/**
 * @param { { role: string, content: string }[] } messages
 * @returns { Promise<string> }
 */
async function askOpenAI(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      //model: "gpt-4o",
      messages: messages,
    }),
  });

  const data = await res.json();

  return data.choices[0].message.content;
}

/**
 * @param {string} prompt
 *
 * @returns { Promise<string> }
 */
function promptUser(prompt) {
  return new Promise((resolve) => {
    const rd = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rd.question(prompt, (answer) => {
      resolve(answer);
      rd.close();
    });
  });
}

/**
 * @param {string} prompt
 *
 * @returns { Promise<boolean> }
 */
async function confirmProposition(prompt) {
  const answer = await promptUser(chalk.red(prompt) + " (tak/nie): ");
  return answer.toLowerCase() === "t" || answer.toLowerCase() === "tak";
}

async function main() {
  const article = await getArticle();
  let messages = [
    {
      role: "system",
      content:
        `Jesteś profesjonalnym redaktorem artykułów z 10-cio letnim doświadczeniem z promptowaniem AI oraz redakcją artykułów internetowych. Twoim zadaniem jest:
          - przeczytanie artykułu
          - edycja struktury artykułu tak aby:
            a. używała ona odpowiednich tagów HTML do strukturyzacji treści
            b. miała określone miejsca na obrazki, które bedziesz miał za zadanie dodać.
          - Nie dodawanie kodu CSS oraz JavaScript. Zwrócony artykuł powinien zawierać wyłącznie zawartość do wstawienia pomiędzy tagami <body> i </body>
          - Ustalenie wraz z rozmówcą w jakich momentach artykułu warto dodać obrazki.
          - W momencie gdy uzytkownik powie, że jest zadowolony z ustalonych miejsc na obrazki, przechodzisz do redakcji artykułu i zwracasz go zgodnie z wymaganiami odnośnie struktury artykułu, dodania obrazków oraz wykożystania tagów HTML.
          - Podczas finalnej redakcji podążać zgodnie z najlepszymi praktykami pisania HTML i używać tagów w sposób jaki należy.

          Dodawanie obrazków:
          - Wybierasz dobre miejsca gdzie warto wstawić obrazek
          - Oznaczasz je z użyciem taga <img> z atrybutem src="image_placeholder.jpg"
          - Dodaj atrybut alt do każdego obrazka z dokładnym, detalicznym promptem, który możemy użyć do wygenerowania grafiki. Prompt powinien jak najlepiej opisywać wygląd obrazka z wieloma detalami.
          - Umieść podpisy pod grafikami używając odpowiedniego tagu HTML
          - Kieruj się zasadą, że obrazki powinny być dodane w odpowiednich miejscach, które pomogą w zrozumieniu treści artykułu.

          W twojej wiadomości powinna znajdować się tylko i wyłącznie treść artykułu w języku HTML. Artykuł nie powinien zawierać tagów <html>, <body>, <script> ani <style> oraz zaden z tagów nie może zawierać stylów CSS.

          Treść artykułu:` + article,
    },
    {
      role: "user",
      content: `W ktorych miejscach najlepiej dodac obrazki?
          Twoja odpowiedź powinna zawierać dokładne miejsca w artykule, gdzie warto dodać obrazki. Pamiętaj, że obrazki powinny pomagać w zrozumieniu treści artykułu.`,
    },
  ];

  console.log(chalk.dim(article));

  while (true) {
    const response = await askOpenAI(messages);

    // Display AI's response in green
    console.log(chalk.greenBright("\n" + response));

    // Ask the user if they are satisfied with the AI's proposition
    const isSatisfied = await confirmProposition(
      "Czy jesteś zadowolony z tej propozycji?",
    );

    if (isSatisfied) {
      // Inform the AI that the user is satisfied
      messages.push({
        role: "user",
        content:
          "Jestem zadowolony z propozycji miejsc na obrazki. Podaj mi zredagowaną treść artykułu.",
      });
      break;
    } else {
      // Allow the user to provide feedback
      const feedback = await promptUser(chalk.red("Podaj swoje uwagi: "));
      messages.push({
        role: "user",
        content: feedback,
      });
    }
  }

  // Finalize the article with AI's help
  const finalArticle = await askOpenAI(messages);
  console.log(chalk.dim(finalArticle));
}

main();
