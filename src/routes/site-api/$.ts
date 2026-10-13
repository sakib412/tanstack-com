import {createFileRoute} from '@tanstack/react-router';

import {app} from '../../server/site-api';

/** The ONE catch-all that hands `/site-api/*` to the Hono app. */
const handle = ({request}: {request: Request}) => app.fetch(request);

export const Route = createFileRoute('/site-api/$')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
