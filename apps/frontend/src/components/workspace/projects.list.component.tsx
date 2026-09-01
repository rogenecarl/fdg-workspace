'use client';

import React, { FC, useCallback } from 'react';
import Link from 'next/link';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useProjects } from '@gitroom/frontend/components/workspace/projects.hooks';
import { ProjectModalComponent } from '@gitroom/frontend/components/workspace/project.modal.component';
import {
  BADGE_BASE,
  PROJECT_STATUS_STYLES,
  badgeStyle,
  dueDateStyle,
} from '@gitroom/frontend/components/workspace/workspace.colors';

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
};

export const ProjectsListComponent: FC = () => {
  const { data, mutate, isLoading } = useProjects();
  const modal = useModals();
  const toaster = useToaster();
  const fetch = useFetch();
  const t = useT();

  const openProject = useCallback(
    (project?: any) => () => {
      modal.openModal({
        title: project
          ? t('edit_project', 'Edit project')
          : t('add_project', 'Add project'),
        withCloseButton: true,
        children: <ProjectModalComponent data={project} reload={mutate} />,
      });
    },
    [mutate, t]
  );

  const removeProject = useCallback(
    (project: any) => async () => {
      if (
        !(await deleteDialog(
          t(
            'delete_project_confirm',
            'Delete {{name}}? Its tasks will be removed too.',
            { name: project.name }
          )
        ))
      ) {
        return;
      }

      await fetch(`/workspace/projects/${project.id}`, { method: 'DELETE' });
      toaster.show(t('project_deleted', 'Project deleted'), 'success');
      mutate();
    },
    [mutate, t]
  );

  // The (site) layout gives children no padding and already renders the page
  // title in its header, so the page owns its surface and never its own <h1>.
  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[15px] transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
        <div className="text-[13px] text-textItemBlur min-w-0">
          {t('projects_description', 'Work in progress for your clients.')}
        </div>
        <button
          type="button"
          onClick={openProject()}
          className="cursor-pointer px-[16px] h-[36px] bg-[#612BD3] hover:bg-[#5520CB] text-white transition-colors rounded-[8px] text-[13px] font-[600] flex items-center justify-center shrink-0"
        >
          {t('add_project', 'Add project')}
        </button>
      </div>

      {isLoading && (
        <div className="text-[14px] text-textItemBlur">
          {t('loading', 'Loading…')}
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="text-center py-[40px] text-[14px] text-textItemBlur">
          {t(
            'no_projects_yet',
            'No projects yet. Add a client first, then create a project for them.'
          )}
        </div>
      )}

      {!!data?.length && (
        <div className="flex flex-col gap-[8px]">
          {data.map((project: any) => (
            <div
              key={project.id}
              className="border border-newBorder rounded-[8px] p-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] hover:bg-boxHover transition-colors"
            >
              <Link
                href={`/workspace/projects/${project.id}`}
                className="flex flex-col min-w-0 flex-1"
              >
                <div className="flex items-center gap-[8px] min-w-0">
                  <span className="text-[15px] font-[600] truncate">
                    {project.name}
                  </span>
                  <span
                    className={`${BADGE_BASE} ${
                      badgeStyle(PROJECT_STATUS_STYLES, project.status).badge
                    } shrink-0`}
                  >
                    {t(
                      project.status.toLowerCase(),
                      STATUS_LABELS[project.status] || project.status
                    )}
                  </span>
                </div>
                <div className="text-[13px] mt-[2px] truncate">
                  <span className="text-textItemBlur">
                    {project.client?.name}
                  </span>
                  {project.dueDate && (
                    <>
                      <span className="text-textItemBlur">{' · '}</span>
                      <span
                        className={dueDateStyle(
                          project.dueDate,
                          project.status === 'COMPLETED' ? 'DONE' : undefined
                        )}
                      >
                        {t('due', 'Due')}{' '}
                        {new Date(project.dueDate).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </Link>
              <div className="flex flex-wrap gap-[6px] shrink-0">
                <Link
                  href={`/workspace/projects/${project.id}`}
                  className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600] flex items-center"
                >
                  {t('open_board', 'Open board')}
                </Link>
                <button
                  type="button"
                  onClick={openProject(project)}
                  className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600]"
                >
                  {t('edit', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={removeProject(project)}
                  className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600]"
                >
                  {t('delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
