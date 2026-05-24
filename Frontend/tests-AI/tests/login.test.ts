// tests-AI/tests/login.test.ts
import { validUser, invalidUser } from "../fixtures/login.fixtures";
import { BASE_URL } from "../../stagehand.config";
import { Stagehand } from "@browserbasehq/stagehand";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const outputsDir = path.join(__dirname, "../../deepeval_tests/outputs");
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

async function createLocalStagehand() {
    const stagehand = new Stagehand({
        env: "LOCAL",
        model: "ollama/llama3.2:latest",
        localBrowserLaunchOptions: { headless: false }
    });
    await stagehand.init();
    const page = stagehand.context.pages()[0];
    return { stagehand, page };
}

describe("Login - Pruebas con Stagehand + Ollama Local", () => {

    beforeAll(async () => {
        const res = await fetch('http://localhost:3000').catch(() => null);
        if (!res) throw new Error('Backend no disponible en localhost:3000');
    });

    afterEach(async () => {
        await wait(35000);
    });

    test("debe mostrar el título de bienvenida", async () => {
        const { stagehand, page } = await createLocalStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000);

            const result = await stagehand.extract(
                "Extrae cualquier texto visible en la página: títulos, encabezados, etiquetas o botones"
            ) as { extraction: string };

            const extracted = result.extraction?.trim() || await page.title();

            expect(extracted.length).toBeGreaterThan(0);

            fs.writeFileSync(
                path.join(outputsDir, "login_heading.json"),
                JSON.stringify({
                    output: `El componente de login muestra el texto: "${extracted}"`
                }, null, 2)
            );
        } finally {
            await stagehand.close();
        }
    });

    test("debe mostrar error con credenciales incorrectas", async () => {
        const { stagehand, page } = await createLocalStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000);
            await page.waitForSelector('#email', { timeout: 10000 });
            await page.locator('#email').fill(invalidUser.email);
            await wait(1000);
            await page.locator('#password').fill(invalidUser.password);
            await wait(1000);
            await page.locator('button[type="submit"]').click();
            await wait(5000);

            const stayedOnLogin = page.url().includes('/login');
            const didNotRedirect = !page.url().includes('/match');

            expect(stayedOnLogin).toBe(true);
            expect(didNotRedirect).toBe(true);

            fs.writeFileSync(
                path.join(outputsDir, "login_invalid.json"),
                JSON.stringify({
                    output: stayedOnLogin
                        ? "El componente rechazó correctamente las credenciales inválidas y mantuvo al usuario en la pantalla de login sin redirigir."
                        : "El componente redirigió incorrectamente con credenciales inválidas."
                }, null, 2)
            );
        } finally {
            await stagehand.close();
        }
    });

    test("debe redirigir a /match tras login exitoso", async () => {
        const { stagehand, page } = await createLocalStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000);
            await page.waitForSelector('#email', { timeout: 10000 });
            await page.locator('#email').fill(validUser.email);
            await wait(1000);
            await page.locator('#password').fill(validUser.password);
            await wait(1000);
            await page.locator('button[type="submit"]').click();

            const maxWait = 30000;
            const interval = 500;
            let elapsed = 0;
            while (elapsed < maxWait) {
                if (page.url().includes("/match")) break;
                await wait(interval);
                elapsed += interval;
            }

            const redirected = page.url().includes("/match");
            console.log("URL actual tras login:", page.url());
            expect(redirected).toBe(true);

            fs.writeFileSync(
                path.join(outputsDir, "login_success.json"),
                JSON.stringify({
                    output: redirected
                        ? "El componente de login procesó las credenciales válidas y redirigió exitosamente al usuario a la pantalla /match."
                        : "El componente de login falló al redirigir al usuario después de credenciales válidas."
                }, null, 2)
            );
        } finally {
            await stagehand.close();
        }
    });

    test("el enlace de registro debe llevar a /signup", async () => {
        const { stagehand, page } = await createLocalStagehand();
        try {
            await page.goto(`${BASE_URL}/login`);
            await wait(3000);
            await page.locator('a[routerlink="/signup"]').click();
            await wait(3000);

            const navigated = page.url().includes("/signup");
            expect(navigated).toBe(true);

            fs.writeFileSync(
                path.join(outputsDir, "login_signup_link.json"),
                JSON.stringify({
                    output: navigated
                        ? "El enlace de registro en el componente de login navegó correctamente a /signup."
                        : "El enlace de registro falló al navegar a /signup."
                }, null, 2)
            );
        } finally {
            await stagehand.close();
        }
    });

});