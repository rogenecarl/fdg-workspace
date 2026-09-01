'use client';

import React, { FC, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useTasks } from '@gitroom/frontend/components/workspace/tasks.hooks';
import { useProject } from '@gitroom/frontend/components/workspace/projects.hooks';
import { TaskModalComponent } from '@gitroom/frontend/components/workspace/task.modal.component';

const DRAG_TYPE = 'workspace-task';

const COLUMNS = [
  { status: 'TODO', key: 'to_do', label: 'To do' },
  { status: 'IN_PROGRESS', key: 'in_progress', label: 'In progress' },
  { status: 'REVIEW', key: 'review', label: 'Review' },
  { status: 'DONE', key: 'done', label: 'Done' },
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-[#d82d7e] text-white',
  MEDIUM: 'bg-btnSimple',
  LOW: 'bg-btnSimple',
};

const TaskCard: FC<{
  task: any;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (id: string, status: string, position: number) => void;
}> = ({ task, index, onEdit, onDelete, onMove }) => {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: task.id, status: task.status, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // Dropping onto a card inserts above it, so cards can be reordered within a
  // column, not just moved between columns.
  const [, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: any) => {
      if (item.id === task.id) {
        return;
      }
      onMove(item.id, task.status, index);
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`border border-newBorder rounded-[8px] p-[12px] bg-newBgColorInner cursor-move hover:bg-boxHover transition-colors ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="text-[14px] font-[600] break-words">{task.title}</div>

      {task.description && (
        <div className="text-[12px] text-textItemBlur mt-[4px] line-clamp-2 break-words">
          {task.description}
        </div>
      )}

      <div className="flex items-center flex-wrap gap-[6px] mt-[10px]">
        <span
          className={`text-[11px] font-[600] px-[8px] py-[2px] rounded-[4px] ${
            PRIORITY_STYLES[task.priority] || 'bg-btnSimple'
          }`}
        >
          {t(task.priority.toLowerCase(), task.priority)}
        </span>

        {task.dueDate && (
          <span className="text-[11px] text-textItemBlur">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}

        <div className="flex gap-[6px] ms-auto">
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-[600] text-textItemBlur hover:text-textColor transition-colors"
          >
            {t('edit', 'Edit')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] font-[600] text-textItemBlur hover:text-textColor transition-colors"
          >
            {t('delete', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

const Column: FC<{
  status: string;
  label: string;
  tasks: any[];
  onAdd: () => void;
  onMove: (id: string, status: string, position: number) => void;
  children: React.ReactNode;
}> = ({ status, label, tasks, onAdd, onMove, children }) => {
  const t = useT();

  // Dropping on the column body (below the cards) appends to the end.
  const [{ isOver }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: any, monitor) => {
      if (monitor.didDrop()) {
        return;
      }
      onMove(item.id, status, tasks.length);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  return (
    <div className="flex flex-col min-w-[260px] flex-1 bg-newBgColor rounded-[12px] border border-newBorder overflow-hidden">
      <div className="px-[16px] py-[12px] border-b border-newBorder flex items-center justify-between gap-[8px]">
        <div className="text-[13px] font-[600] truncate">
          {label}
          <span className="text-textItemBlur ms-[6px]">{tasks.length}</span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          title={t('add_task', 'Add task')}
          className="cursor-pointer w-[28px] h-[28px] rounded-[6px] bg-btnSimple hover:bg-boxHover transition-colors text-[16px] leading-none shrink-0"
        >
          +
        </button>
      </div>

      <div
        ref={drop as any}
        className={`p-[12px] flex flex-col gap-[8px] min-h-[120px] flex-1 transition-colors ${
          isOver ? 'bg-boxHover' : ''
        }`}
      >
        {children}
        {!tasks.length && (
          <div className="text-[12px] text-textItemBlur text-center py-[16px]">
            {t('drop_tasks_here', 'Drop tasks here')}
          </div>
        )}
      </div>
    </div>
  );
};

export const TaskBoardComponent: FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data: project } = useProject(projectId);
  const { data: tasks, mutate, isLoading } = useTasks(projectId);
  const modal = useModals();
  const toaster = useToaster();
  const fetch = useFetch();
  const t = useT();

  const byStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };
    (tasks || []).forEach((task: any) => {
      (grouped[task.status] || grouped.TODO).push(task);
    });
    return grouped;
  }, [tasks]);

  const openTask = useCallback(
    (task?: any, defaultStatus?: string) => () => {
      modal.openModal({
        title: task ? t('edit_task', 'Edit task') : t('add_task', 'Add task'),
        withCloseButton: true,
        children: (
          <TaskModalComponent
            data={task}
            projectId={projectId}
            defaultStatus={defaultStatus}
            reload={mutate}
          />
        ),
      });
    },
    [mutate, projectId, t]
  );

  const removeTask = useCallback(
    (task: any) => async () => {
      if (
        !(await deleteDialog(
          t('delete_task_confirm', 'Delete {{name}}?', { name: task.title })
        ))
      ) {
        return;
      }

      await fetch(`/workspace/tasks/${task.id}`, { method: 'DELETE' });
      toaster.show(t('task_deleted', 'Task deleted'), 'success');
      mutate();
    },
    [mutate, t]
  );

  const moveTask = useCallback(
    async (id: string, status: string, position: number) => {
      // Optimistic: reorder locally so the card lands immediately, then let the
      // server's ordering win when the revalidation comes back.
      await fetch(`/workspace/tasks/${id}/move`, {
        method: 'PUT',
        body: JSON.stringify({ status, position }),
      });
      mutate();
    },
    [mutate]
  );

  // The (site) layout gives children no padding, so the page owns its surface.
  // The layout header shows "Projects"; the project's own name belongs here.
  // `min-w-0` on the surface is what lets the column strip scroll instead of
  // stretching the whole page sideways.
  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[15px] min-w-0 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-[12px]">
        <div className="min-w-0">
          <Link
            href="/workspace/projects"
            className="text-[13px] text-textItemBlur hover:text-newTextColor transition-colors"
          >
            ← {t('back_to_projects', 'Back to projects')}
          </Link>
          <div className="text-[15px] font-[600] mt-[4px] truncate">
            {project?.name || t('loading', 'Loading…')}
          </div>
        </div>
        {project?.client?.name && (
          <div className="text-[13px] text-textItemBlur truncate shrink-0">
            {project.client.name}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-[14px] text-textItemBlur">
          {t('loading', 'Loading…')}
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          {/* The strip scrolls horizontally on narrow screens rather than
              squashing the columns; the page itself never scrolls sideways.
              Columns stretch to equal height so the board reads as a grid
              rather than a ragged row. */}
          <div className="flex gap-[12px] overflow-x-auto pb-[8px] flex-1">
            {COLUMNS.map((column) => (
              <Column
                key={column.status}
                status={column.status}
                label={t(column.key, column.label)}
                tasks={byStatus[column.status]}
                onAdd={openTask(undefined, column.status)}
                onMove={moveTask}
              >
                {byStatus[column.status].map((task: any, index: number) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onEdit={openTask(task)}
                    onDelete={removeTask(task)}
                    onMove={moveTask}
                  />
                ))}
              </Column>
            ))}
          </div>
        </DndProvider>
      )}
    </div>
  );
};
