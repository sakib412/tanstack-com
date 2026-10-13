import {Hono} from 'hono';
import {HTTPException} from 'hono/http-exception';
import {validator} from 'hono/validator';

import {type DbEnv, withDb} from '../middleware';
import {parseId, parseText} from '../validate';

export interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

const MAX_TITLE = 200;
const MAX_TODOS = 500;

/** Re-projected field by field: only these reach the browser. */
function toTodo(row: {id: number; title: string; done: boolean; createdAt: Date}): Todo {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: row.createdAt.toISOString(),
  };
}

const createBody = validator('json', (value: unknown) => {
  const body = (value ?? {}) as Record<string, unknown>;
  return {title: parseText(body.title, 'title', MAX_TITLE)};
});

const updateBody = validator('json', (value: unknown) => {
  const body = (value ?? {}) as Record<string, unknown>;
  const patch: {title?: string; done?: boolean} = {};
  if (body.title !== undefined) {
    patch.title = parseText(body.title, 'title', MAX_TITLE);
  }
  if (body.done !== undefined) {
    if (typeof body.done !== 'boolean') {
      throw new HTTPException(400, {message: '`done` must be a boolean.'});
    }
    patch.done = body.done;
  }
  return patch;
});

export const todos = new Hono<DbEnv>()
  .use(withDb)
  .get('/', async c => {
    const rows = await c.var.db.todo.findMany({
      orderBy: [{done: 'asc'}, {createdAt: 'desc'}],
      take: MAX_TODOS,
    });
    return c.json({todos: rows.map(toTodo)});
  })
  .post('/', createBody, async c => {
    const {title} = c.req.valid('json');
    if ((await c.var.db.todo.count()) >= MAX_TODOS) {
      throw new HTTPException(409, {message: `The list is full (${MAX_TODOS} todos).`});
    }
    const row = await c.var.db.todo.create({data: {title}});
    return c.json({todo: toTodo(row)}, 201);
  })
  .post('/clear-completed', async c => {
    const {count} = await c.var.db.todo.deleteMany({where: {done: true}});
    return c.json({deleted: count});
  })
  .patch('/:id', updateBody, async c => {
    const id = parseId(c.req.param('id'));
    const patch = c.req.valid('json');
    const {count} = await c.var.db.todo.updateMany({where: {id}, data: patch});
    if (count === 0) {
      throw new HTTPException(404, {message: 'Todo not found.'});
    }
    const row = await c.var.db.todo.findUniqueOrThrow({where: {id}});
    return c.json({todo: toTodo(row)});
  })
  .delete('/:id', async c => {
    const id = parseId(c.req.param('id'));
    const {count} = await c.var.db.todo.deleteMany({where: {id}});
    if (count === 0) {
      throw new HTTPException(404, {message: 'Todo not found.'});
    }
    return c.json({deleted: id});
  });
