import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import * as WorkspaceService from '../services/WorkspaceService.js';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'editor', 'viewer']).default('viewer')
});

const updateMemberSchema = z.object({
  role: z.enum(['editor', 'viewer'])
});

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export async function workspaceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  // GET / — lista workspaces do usuário (owner ou membro)
  fastify.get('/', async (request) => {
    return WorkspaceService.listUserWorkspaces(request.user.id);
  });

  // POST / — cria novo workspace
  fastify.post('/', async (request) => {
    const { name } = createWorkspaceSchema.parse(request.body);
    return WorkspaceService.createWorkspace(request.user.id, name);
  });

  // POST /:workspaceId/invite — envia convite
  fastify.post<{ Params: { workspaceId: string } }>(
    '/:workspaceId/invite',
    async (request, reply) => {
      const { workspaceId } = request.params;
      const { email, role } = inviteSchema.parse(request.body);
      
      try {
        const invite = await WorkspaceService.sendInvite(request.user.id, workspaceId, email, role);
        return { invite };
      } catch (error: any) {
        if (error.message === 'FORBIDDEN') return reply.code(403).send({ error: 'Permission denied' });
        if (error.message === 'WORKSPACE_NOT_FOUND') return reply.code(404).send({ error: 'Workspace not found' });
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // GET /:workspaceId/invites — lista convites
  fastify.get<{ Params: { workspaceId: string } }>(
    '/:workspaceId/invites',
    async (request, reply) => {
      try {
        return await WorkspaceService.listInvites(request.user.id, request.params.workspaceId);
      } catch (error: any) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
    }
  );

  // DELETE /:workspaceId/invites/:inviteId — remove convite
  fastify.delete<{ Params: { workspaceId: string; inviteId: string } }>(
    '/:workspaceId/invites/:inviteId',
    async (request, reply) => {
      try {
        await WorkspaceService.revokeInvite(request.user.id, request.params.workspaceId, request.params.inviteId);
        return { success: true };
      } catch (error: any) {
        return reply.code(403).send({ error: 'Forbidden' });
      }
    }
  );

  // PUT /:workspaceId/members/:memberId — atualiza cargo
  fastify.put<{ Params: { workspaceId: string; memberId: string } }>(
    '/:workspaceId/members/:memberId',
    async (request, reply) => {
      const body = updateMemberSchema.parse(request.body);
      try {
        await WorkspaceService.updateMemberRole(request.user.id, request.params.workspaceId, request.params.memberId, body.role);
        return { success: true };
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // DELETE /:workspaceId/members/:memberId — remove membro
  fastify.delete<{ Params: { workspaceId: string; memberId: string } }>(
    '/:workspaceId/members/:memberId',
    async (request, reply) => {
      try {
        await WorkspaceService.removeMember(request.user.id, request.params.workspaceId, request.params.memberId);
        return { success: true };
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}