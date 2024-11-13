import * as z from "zod";
import fs from "fs";

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
 * @param {string} content
 * @returns { Promise<string> }
 */
async function askOpenAI(content) {
  const url = "https://api.openai.com/v1/chat/completions";
  // Free API with llama-3.1
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
      model: "gpt-4o",
      messages: [
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
          
          Dodawanie obrazków:
          - Wybierasz dobre miejsca gdzie warto wstawić obrazek
          - Oznaczasz je z użyciem taga <img> z atrybutem src="image_placeholder.jpg"
          - Dodaj atrybut alt do każdego obrazka z dokładnym, detalicznym promptem, który możemy użyć do wygenerowania grafiki. Prompt powinien jak najlepiej opisywać wygląd obrazka z wieloma detalami.
          - Umieść podpisy pod grafikami używając odpowiedniego tagu HTML
          - Kieruj się zasadą, że obrazki powinny być dodane w odpowiednich miejscach, które pomogą w zrozumieniu treści artykułu.

          W twojej wiadomości powinna znajdować się tylko i wyłącznie treść artykułu w języku HTML. Artykuł nie powinien zawierać tagów <html>, <body>, <script> ani <style> oraz zaden z tagów nie może zawierać stylów CSS.

          Treść artykułu:` + content,
        },
        {
          role: "user",
          content: `W ktorych miejscach najlepiej dodac obrazki?
          Twoja odpowiedź powinna zawierać dokładne miejsca w artykule, gdzie warto dodać obrazki. Pamiętaj, że obrazki powinny pomagać w zrozumieniu treści artykułu.`,
        },
      ],
    }),
  });

  const data = await res.json();

  return data.choices[0].message.content;
}

async function main() {
  const article = await getArticle();
  const answer = await askOpenAI(article);

  const result = await writeToFile("article.html", answer);

  console.log(result);
}

main();
