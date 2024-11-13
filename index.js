import fs from "fs";
import readline from "readline";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

function formatArticle(article) {
  const paragraphs = article.split("\n").map((paragraph) => {
    if (paragraph.startsWith("<")) {
      return paragraph;
    }

    return paragraph.trim();
  });

  return paragraphs.join("\n");
}

async function generatePreview(articleContent) {
  const templatePath = "szablon.html";
  const previewPath = "podglad.html";

  if (fs.existsSync(previewPath)) {
    //
  }

  // Read the template file
  const template = fs.readFileSync(templatePath, "utf-8");

  // Insert the article content into the body of the template
  const previewContent = template.replace(
    "<!-- Wklej artykuł tutaj -->",
    articleContent,
  );

  // Write the preview content to the podglad.html file
  await writeToFile(previewPath, previewContent);
}

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
  const url = "https://api.openai.com/v1/chat/completions";
  //const url = "https://api.groq.com/openai/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      //Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      //model: "llama-3.1-70b-versatile",
      model: "gpt-3.5-turbo",
      messages: messages,
    }),
  });

  const data = await res.json();

  console.log(data);

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

const article = await getArticle();
let messages = [
  {
    role: "system",
    content:
      `Jesteś profesjonalnym formaterem artykułów z 10-cio letnim doświadczeniem z promptowaniem AI oraz formatowaniu artykułów internetowych. Twoim zadaniem jest:
          - przeczytanie artykułu
          - edycja struktury artykułu tak aby:
            a. używała ona odpowiednich tagów HTML do strukturyzacji treści
            b. miała określone miejsca na obrazki, które bedziesz miał za zadanie dodać.
          - Nie dodawanie kodu CSS oraz JavaScript. Zwrócony artykuł powinien zawierać wyłącznie zawartość do wstawienia pomiędzy tagami <body> i </body>
          - Ustalenie wraz z rozmówcą w jakich momentach artykułu warto dodać obrazki.
          - W momencie gdy uzytkownik powie, że jest zadowolony z ustalonych miejsc na obrazki, przechodzisz do formatowania artykułu i zwracasz go zgodnie z wymaganiami odnośnie miejsc obrazków oraz wykorzystania tagów HTML.
          - Podczas finalnego formatowania, podążać zgodnie z najlepszymi praktykami pisania HTML i używać tagów w sposób jaki należy.

          Dodawanie obrazków:
          - Wybierasz miejsca gdzie powinno się wstawić obrazek
          - Oznaczasz je z użyciem taga <img> z atrybutem src="image_placeholder.jpg"
          - Dodajesz atrybut alt do każdego obrazka z dokładnym, detalicznym promptem, który możemy użyć do wygenerowania grafiki. Prompt powinien jak najlepiej opisywać wygląd obrazka z detalami.
          - Umieść podpisy pod grafikami używając odpowiedniego tagu HTML
          - Kieruj się zasadą, że obrazki powinny być dodane w odpowiednich miejscach, które pomogą w zrozumieniu treści artykułu.

          <IMPORTANT>
            - W twojej wiadomości zwrotnej powinna znajdować się tylko i wyłącznie treść artykułu w języku HTML. Artykuł nie powinien zawierać tagów <html>, <body>, <script> ani <style>, żaden z tagów nie może zawierać stylów CSS oraz treść artykułu nie może być zmodyfikowana.
            - Nie modyfikuj treści artykułu, jedynie dodaj odpowiednie tagi HTML.
            - Nie zwracaj sie z żadnymi zapytaniami ani objaśnieniami do użytkownika, jedynie zwróć sformatowany artykuł.
          </IMPORTANT>

          Treść artykułu:` + article,
  },
  {
    role: "user",
    content: `Sformatuj artykuł. Twoja odpowiedź powinna zawierać sformatowany artykuł z dodanymi obrazkami. Pamiętaj, że obrazki powinny pomagać w zrozumieniu treści artykułu.`,
  },
];

async function main() {
  console.log(chalk.dim(article));

  while (true) {
    const response = await askOpenAI(messages);

    messages.push({
      role: "assistant",
      content: response,
    });

    // Display AI's response in green
    console.log(chalk.greenBright("\n" + response));

    // Ask the user if they are satisfied with the AI's proposition
    const isSatisfied = await confirmProposition(
      "Czy jesteś zadowolony z tej propozycji?",
    );

    if (!isSatisfied) {
      // Allow the user to provide feedback
      const feedback = await promptUser(chalk.red("Podaj swoje uwagi: "));
      messages.push({
        role: "user",
        content: feedback,
      });
    } else {
      break;
    }
  }

  await writeToFile("artykul.html", messages[messages.length - 1].content);

  await generatePreview(formatArticle(messages[messages.length - 1].content));

  console.log(chalk.dim(messages[messages.length - 1].content));
}

main();
