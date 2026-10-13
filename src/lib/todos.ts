/**
 * The todo list, through server functions — like `api.ts`, pages never call an
 * API themselves. Each function calls the Site API in-process; see
 * `site-api-client.ts`.
 */
import {createServerFn} from '@tanstack/react-start';

import type {Todo} from '../server/site-api';
import {errorOf, siteApi} from './site-api-client';

export type {Todo};

export interface TodoList {
  todos: Array<Todo>;
  /** Set when the list could not be read (e.g. the Site Database is off). */
  error: string | null;
}

export const listTodos = createServerFn({method: 'GET'}).handler(
  async (): Promise<TodoList> => {
    const res = await (await siteApi()).todos.$get();
    if (!res.ok) {
      return {todos: [], error: await errorOf(res)};
    }
    const {todos} = await res.json();
    return {todos, error: null};
  }
);

export const addTodo = createServerFn({method: 'POST'})
  .validator((input: {title: string}) => ({title: String(input.title)}))
  .handler(async ({data}): Promise<Todo> => {
    const res = await (await siteApi()).todos.$post({json: data});
    if (!res.ok) {
      throw new Error(await errorOf(res));
    }
    return (await res.json()).todo;
  });

export const setTodoDone = createServerFn({method: 'POST'})
  .validator((input: {id: number; done: boolean}) => ({
    id: Number(input.id),
    done: Boolean(input.done),
  }))
  .handler(async ({data}): Promise<Todo> => {
    const res = await (await siteApi()).todos[':id'].$patch({
      param: {id: String(data.id)},
      json: {done: data.done},
    });
    if (!res.ok) {
      throw new Error(await errorOf(res));
    }
    return (await res.json()).todo;
  });

export const deleteTodo = createServerFn({method: 'POST'})
  .validator((input: {id: number}) => ({id: Number(input.id)}))
  .handler(async ({data}): Promise<void> => {
    const res = await (await siteApi()).todos[':id'].$delete({param: {id: String(data.id)}});
    if (!res.ok) {
      throw new Error(await errorOf(res));
    }
  });

export const clearCompleted = createServerFn({method: 'POST'}).handler(
  async (): Promise<void> => {
    const res = await (await siteApi()).todos['clear-completed'].$post();
    if (!res.ok) {
      throw new Error(await errorOf(res));
    }
  }
);
