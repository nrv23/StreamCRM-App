import fs from "node:fs/promises";
import path from "node:path";

import Handlebars, {
    type TemplateDelegate,
} from "handlebars";

import {
    ITemplateEngine,
    TemplateParameter,
    TemplateValue,
} from "../interfaces/templateEngine.interface.ts";

export class HandlebarsTemplateEngine implements ITemplateEngine {
    private readonly compiledTemplates =
        new Map<string, TemplateDelegate>();

    constructor(
        private readonly templatesDirectory: string,
    ) { }

    async render(
        templateName: string,
        parameters: TemplateParameter[],
    ): Promise<string> {
        const template = await this.getCompiledTemplate(templateName);
        const context = this.mapParameters(parameters);
        return template(context);
    }

    private async getCompiledTemplate(
        templateName: string,
    ): Promise<TemplateDelegate> {
        const cachedTemplate = this.compiledTemplates.get(templateName);

        if (cachedTemplate) {
            return cachedTemplate;
        }

        const templatePath = path.join(
            this.templatesDirectory,
            `${templateName}.hbs`,
        );

        let source: string;

        try {
            source = await fs.readFile(
                templatePath,
                "utf8",
            );
        } catch (error) {
            throw new Error(
                `Template "${templateName}" could not be loaded from ${templatePath}`,
                {
                    cause: error,
                },
            );
        }

        const compiledTemplate = Handlebars.compile(source);
        this.compiledTemplates.set(
            templateName,
            compiledTemplate,
        );

        return compiledTemplate;
    }

    private mapParameters(
        parameters: TemplateParameter[],
    ): Record<string, TemplateValue> {
        const context: Record<string, TemplateValue> = {};

        for (const parameter of parameters) {
            const key = parameter.placeholder.trim();

            if (!key) {
                throw new Error(
                    "Template placeholder cannot be empty",
                );
            }

            if (Object.hasOwn(context, key)) { // valida si la propiedad ya existe anteriormente
                throw new Error(
                    `Duplicated template placeholder: ${key}`,
                );
            }

            context[key] = this.normalizeValue(
                parameter.value,
            );
        }

        return context;
    }

    private normalizeValue(
        value: TemplateValue,
    ): TemplateValue {
        if (value instanceof Date) {
            return value.toISOString();
        }

        return value;
    }
}