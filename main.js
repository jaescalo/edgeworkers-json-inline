/*
(c) Copyright 2020 Akamai Technologies, Inc. Licensed under Apache 2 license.
Version: 1.1
Purpose:  Modify an HTML streamed response by replacing a text string two times across the entire response.
*/

import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';
import { FindAndReplaceStream } from 'find-replace-stream.js';
import { logger } from 'log';

const endPoint = '/inline.json';

async function getJSON() {
  const response = await httpRequest('https://jaescalo.test.edgekey.net/inline.json');
  if (response.ok) {
      return await response.text();
  } else {
      return { error: `Failed to return`};
  }
}

export async function responseProvider (request) {
  // Get text to be searched for and new replacement text from Property Manager variables in the request object.
  const tosearchfor = "</body>";

  const newtext = getJSON();
  const newtext2 = await Promise.resolve(newtext);
  logger.log(newtext2); 

  // Set to 0 to replace all, otherwise a number larger than 0 to limit replacements
  const howManyReplacements = 1;

  return httpRequest(`${request.scheme}://${request.host}/json-inline-demo/index.html`).then(response => {
    return createResponse(
      response.status,
      response.headers,
      response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new FindAndReplaceStream(tosearchfor, newtext2, howManyReplacements)).pipeThrough(new TextEncoderStream())
    );
  });
}

