import { Hono } from 'hono';
import { agentsMiddleware } from 'hono-agents';
import { HollywoodAgent } from './agents/hollywood';

export {HollywoodAgent};

const app = new Hono<{ Bindings: Env }>();

app.get('/images/posters/:fileName{.+\\.jpg}', async(c) => {
    const {fileName} = c.req.param();
    const obj = await c.env.MOVIE_POSTERS.get(fileName);
    if (obj === null) {
        return c.notFound();
    }
    // TODO: caching
    return c.body(obj.body, 200, {
        "Content-Type": "image/jpeg"
    });
});

app.use('*', agentsMiddleware());

export default app;