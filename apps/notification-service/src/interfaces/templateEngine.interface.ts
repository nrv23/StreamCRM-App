export type TemplateValue =
    | string
    | number
    | boolean
    | Date
    | null
    | undefined;

export interface TemplateParameter {
    placeholder: string;
    value: TemplateValue;
}

export interface ITemplateEngine {
    render(
        templateName: string,
        parameters: TemplateParameter[],
    ): Promise<string>;
}