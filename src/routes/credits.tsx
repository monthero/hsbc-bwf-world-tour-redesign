import { createFileRoute } from '@tanstack/react-router';

import { CreditsPage } from '~/pages/credits/CreditsPage';

export const Route = createFileRoute('/credits')({ component: CreditsPage });
