export function request(ctx) {
  const { ingredients = [] } = ctx.args;
  const prompt = `Suggest a recipe idea using these ingredients: ${ingredients.join(", ")}.`;

  return {
    // ADD THE "us." PREFIX TO ENABLE ON-DEMAND THROUGHPUT
    resourcePath: `/model/us.anthropic.claude-3-5-sonnet-20241022-v2:0/invoke`,
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `\n\nHuman: ${prompt}\n\nAssistant:`,
              },
            ],
          },
        ],
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return { body: `AWS Error: ${ctx.error.message}` };
  }
  if (ctx.result.statusCode !== 200) {
    return { body: `Bedrock Error (${ctx.result.statusCode}): ${ctx.result.body}` };
  }
  const parsedBody = JSON.parse(ctx.result.body);
  return {
    body: parsedBody.content[0].text,
  };
}