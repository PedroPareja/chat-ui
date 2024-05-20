import { smallModel } from "$lib/server/models";
import type { EndpointMessage } from "./endpoints/endpoints";

export async function generateFromDefaultEndpoint({
	messages,
	preprompt,
	generateSettings,
}: {
	messages: EndpointMessage[];
	preprompt?: string;
	generateSettings?: Record<string, unknown>;
}): Promise<string> {
	const endpoint = await smallModel.getEndpoint();

	const tokenStream = await endpoint({ messages, preprompt, generateSettings });
	
	let generated_text = "";

	for await (const output of tokenStream) {

		if (!output.generated_text) {
			if (!output.token.special) {
				// no output check
				if (!output) {
					break;
				}

				// otherwise we just concatenate tokens
				generated_text += output.token.text;
			}
		} else {
			// add output.generated text to the last message
			// strip end tokens from the output.generated_text
			const text = (smallModel.parameters.stop ?? []).reduce((acc: string, curr: string) => {
				if (acc.endsWith(curr)) {					
					return acc.slice(0, acc.length - curr.length);
				}
				return acc;
			}, output.generated_text.trimEnd());

			generated_text = text;
		}
	}

	console.log("Generated text: " + generated_text)

	if(generated_text)
		return generated_text

/*
		// if not generated_text is here it means the generation is not done
		if (output.generated_text) {
			let generated_text = output.generated_text;
			for (const stop of [...(smallModel.parameters?.stop ?? []), "<|endoftext|>"]) {
				if (generated_text.endsWith(stop)) {
					generated_text = generated_text.slice(0, -stop.length).trimEnd();
				}
			}
			return generated_text;
		}
	}
*/
	throw new Error("Generation failed");
}
