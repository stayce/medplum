// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Mock } from 'vitest';
import { vi } from 'vitest';

export const mockGetAccessToken = vi.fn().mockResolvedValue('ya29.test-token') as Mock;

export const mockGetProjectId = vi.fn().mockResolvedValue('test-project') as Mock;

export const GoogleAuth = vi.fn(function GoogleAuth(this: {
  getAccessToken: typeof mockGetAccessToken;
  getProjectId: typeof mockGetProjectId;
}) {
  this.getAccessToken = mockGetAccessToken;
  this.getProjectId = mockGetProjectId;
});
