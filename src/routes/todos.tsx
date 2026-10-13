import {createFileRoute, useRouter} from '@tanstack/react-router';
import {type FormEvent, useState} from 'react';

import {
  addTodo,
  clearCompleted,
  deleteTodo,
  listTodos,
  setTodoDone,
  type Todo,
} from '../lib/todos';
import {pageTitle} from '../lib/title';

type Filter = 'all' | 'active' | 'done';

const FILTERS: Array<{value: Filter; label: string}> = [
  {value: 'all', label: 'All'},
  {value: 'active', label: 'Active'},
  {value: 'done', label: 'Done'},
];

export const Route = createFileRoute('/todos')({
  loader: async () => await listTodos(),
  head: ({matches}) => ({meta: [{title: pageTitle(matches, 'Todos')}]}),
  component: Todos,
});

function Todos() {
  const {todos, error: loadError} = Route.useLoaderData();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Run a mutation, then reload the list from the database. */
  async function run(action: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await action();
      await router.invalidate();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    const value = title.trim();
    if (!value) {
      return;
    }
    if (await run(() => addTodo({data: {title: value}}))) {
      setTitle('');
    }
  }

  const remaining = todos.filter(todo => !todo.done).length;
  const doneCount = todos.length - remaining;
  const visible = todos.filter(todo =>
    filter === 'all' ? true : filter === 'done' ? todo.done : !todo.done
  );

  return (
    <main className="wrap narrow section">
      <h1>Todos</h1>

      {loadError ? (
        <p className="notice" role="alert">
          {loadError}
        </p>
      ) : (
        <>
          <form className="todo-form" onSubmit={onAdd}>
            <input
              className="input"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="What needs doing?"
              aria-label="New todo"
              maxLength={200}
              disabled={busy}
            />
            <button className="button" type="submit" disabled={busy || !title.trim()}>
              Add
            </button>
          </form>

          {error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}

          {todos.length === 0 ? (
            <p className="muted">Nothing to do yet. Add your first todo above.</p>
          ) : (
            <>
              <div className="todo-toolbar">
                <span className="muted small">
                  {remaining} of {todos.length} left
                </span>
                <div className="segmented" role="group" aria-label="Filter">
                  {FILTERS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={filter === option.value}
                      onClick={() => setFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="todo-list">
                {visible.map(todo => (
                  <TodoItem key={todo.id} todo={todo} busy={busy} run={run} />
                ))}
              </ul>
              {visible.length === 0 && <p className="muted small">No todos here.</p>}

              {doneCount > 0 && (
                <button
                  type="button"
                  className="button link"
                  disabled={busy}
                  onClick={() => run(() => clearCompleted())}
                >
                  Clear {doneCount} completed
                </button>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

function TodoItem({
  todo,
  busy,
  run,
}: {
  todo: Todo;
  busy: boolean;
  run: (action: () => Promise<unknown>) => Promise<boolean>;
}) {
  return (
    <li className={todo.done ? 'todo done' : 'todo'}>
      <label>
        <input
          type="checkbox"
          checked={todo.done}
          disabled={busy}
          onChange={event =>
            run(() => setTodoDone({data: {id: todo.id, done: event.target.checked}}))
          }
        />
        <span>{todo.title}</span>
      </label>
      <button
        type="button"
        className="icon-button"
        aria-label={`Delete “${todo.title}”`}
        disabled={busy}
        onClick={() => run(() => deleteTodo({data: {id: todo.id}}))}
      >
        ×
      </button>
    </li>
  );
}
