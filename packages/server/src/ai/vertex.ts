// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { badRequest, OperationOutcomeError } from '@medplum/core';
import { GoogleAuth } from 'google-auth-library';

/**
 * Google Vertex AI as a destination for the OpenAI provider.
 *
 * Vertex serves Gemini in the OpenAI chat-completions wire format at its `endpoints/openapi`
 * endpoint, so `callOpenAi` and `streamOpenAi` talk to it unchanged. This file only
 * supplies that endpoint and a bearer token.
 *
 * Vertex accepts nothing there but a Google OAuth access token, which lives for an hour, so the
 * token cannot be stored in a project secret. It is minted from the server's Application Default
 * Credentials, the same identity the server already uses for Cloud Storage and Secret Manager.
 * The Google Cloud project is the one those credentials resolve to (`GOOGLE_CLOUD_PROJECT`
 * overrides it), never one named in a project secret, so a project admin cannot aim the server's
 * token at another project.
 */

const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });

/**
 * A Vertex location such as `us-central1` or `global`. The location becomes part of the hostname,
 * so anything that is not a single hostname label could send the server's token to another host.
 */
const LOCATION_PATTERN = /^[a-z0-9-]+$/;

/**
 * Returns the Vertex chat-completions base URL for a location and a current access token for it.
 * @param location - A Vertex location, such as `global` or `us-central1`
 * @returns The base URL to hand to the OpenAI provider, and the token to send as its bearer
 */
export async function getVertexEndpoint(location: string): Promise<{ baseUrl: string; apiKey: string }> {
  if (!LOCATION_PATTERN.test(location)) {
    throw new OperationOutcomeError(badRequest(`Invalid Vertex AI location: ${location}`));
  }
  const apiKey = await auth.getAccessToken();
  if (!apiKey) {
    throw new Error('Google Application Default Credentials returned no access token');
  }
  const projectId = await auth.getProjectId();
  const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
  return { baseUrl: `https://${host}/v1/projects/${projectId}/locations/${location}/endpoints/openapi`, apiKey };
}
