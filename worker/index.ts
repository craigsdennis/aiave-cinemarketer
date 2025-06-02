import { Hono } from 'hono';
import { agentsMiddleware } from 'hono-agents';
import { HollywoodAgent } from './agents/hollywood';

export {HollywoodAgent};

const app = new Hono<{ Bindings: Env }>();

app.get('/hello', async(c) => {
    return c.json({hello: "world"});
});

app.use('*', agentsMiddleware());

export default app;