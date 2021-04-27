/*
(c) Copyright 2020 Akamai Technologies, Inc. Licensed under Apache 2 license.
Version: 1.1
Purpose:  Modify an HTML streamed response by replacing a text string two times across the entire response.
*/

import { ReadableStream, WritableStream } from 'streams';
import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';
import { logger } from 'log';

class HTMLStream {
  constructor () {
    let readController = null;

    const script = `<data class="json-data" value='{"unicorns": "greatawesome","abc": [1, 2, 3],"careful": "to escape &#39; quotes"}'></data>`;
    const tag = '</body>';

    this.readable = new ReadableStream({
      start (controller) {
        readController = controller;
      }
    });

    async function handleTemplate (text) {
      const startIndex = text.indexOf(tag);
      if (startIndex === -1) {
        readController.enqueue(text);
      } else {
        readController.enqueue(text.substring(0, startIndex));
        readController.enqueue(script);
        readController.enqueue(text.substring(startIndex));
      }
    }

    let completeProcessing = Promise.resolve();

    this.writable = new WritableStream({
      write (text) {
        completeProcessing = handleTemplate(text, 0);
      },
      close (controller) {
        completeProcessing.then(() => readController.close());
      }
    });
  }
}

export function responseProvider (request) {
  return httpRequest(`${request.scheme}://${request.host}/json-inline-demo/index.html`).then(response => {
    return createResponse(
      response.status,
      response.getHeaders(),
      response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new HTMLStream()).pipeThrough(new TextEncoderStream())
    );
  });
}