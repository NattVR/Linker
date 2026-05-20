import { createStagehand } from "../helpers/stagehand.helper";
import { validUser, invalidUser } from "../fixtures/login.fixtures";
import { BASE_URL } from "../../stagehand.config";

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

describe("Login - Pruebas con Stagehand + Gemini", () => {

    afterEach(async () => {
        await wait(65000); // espera 65s entre tests para resetear el rate limit de Gemini
    });

    test("debe mostrar el título de bienvenida", async () => {
        const { stagehand, page } = await createStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000); // espera que Angular cargue
            const result = await stagehand.extract(
                "Extract the main welcome heading text from the page"
            ) as { extraction: string };
            expect(result.extraction).toBeTruthy();
            expect(result.extraction.toLowerCase()).toMatch(/bienvenido|iniciar/i);
        } finally {
            await stagehand.close();
        }
    });

    test("debe mostrar error con credenciales incorrectas", async () => {
        const { stagehand, page } = await createStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000);
            await stagehand.act(`Type ${invalidUser.email} in the email field`);
            await wait(4000);
            await stagehand.act(`Type ${invalidUser.password} in the password field`);
            await wait(4000);
            await stagehand.act("Click the submit or login button");
            await wait(4000);
            const result = await stagehand.extract(
                "Extract any error message or alert popup text visible on screen"
            );
            expect(JSON.stringify(result)).toMatch(/error|credencial|inválid/i);
        } finally {
            await stagehand.close();
        }
    });

    test("debe redirigir a /match tras login exitoso", async () => {
        const { stagehand, page } = await createStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000);
            await stagehand.act(`Type ${validUser.email} in the email field`);
            await wait(4000);
            await stagehand.act(`Type ${validUser.password} in the password field`);
            await wait(4000);
            await stagehand.act("Click the login button");
            await wait(5000);
            expect(page.url()).toContain("/match");
        } finally {
            await stagehand.close();
        }
    });

    test("el enlace de registro debe llevar a /signup", async () => {
        const { stagehand, page } = await createStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000);
            await stagehand.act("Click the link to register or sign up");
            await wait(3000);
            expect(page.url()).toContain("/signup");
        } finally {
            await stagehand.close();
        }
    });
});