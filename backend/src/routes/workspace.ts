import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '../lib/db.js';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'editor', 'viewer']).default('viewer')
});

const updateMemberSchema = z.object({
  role: z.enum(['editor', 'viewer'])
});

export async function workspaceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
  });

  fastify.post<{ Params: { workspaceId: string } }>(
    '/:workspaceId/invite',
    async (request: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { workspaceId } = request.params;
      const body = inviteSchema.parse(request.body);

      const workspace = await db.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: true }
      });

      if (!workspace) {
        return reply.code(404).send({ error: 'Workspace not found' });
      }

      if (workspace.ownerId !== userId) {
        return reply.code(403).send({ error: 'Only owner can invite members' });
      }

      const existingMember = workspace.members.find(m => m.email === body.email);
      if (existingMember) {
        return reply.code(400).send({ error: 'User is already a member' });
      }

      const existingInvite = await db.workspaceInvite.findFirst({
        where: { email: body.email, workspaceId }
      });
      if (existingInvite && new Date(existingInvite.expiresAt) > new Date()) {
        return reply.code(400).send({ error: 'Invite already sent to this email' });
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invite = await db.workspaceInvite.create({
        data: {
          email: body.email,
          role: body.role,
          token,
          workspaceId,
          expiresAt
        }
      });

      return { invite: { ...invite, token } };
    }
  );

  fastify.get<{ Params: { workspaceId: string } }>(
    '/:workspaceId/invites',
    async (request: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;

      const workspace = await db.workspace.findUnique({
        where: { id: request.params.workspaceId }
      });

      if (!workspace || workspace.ownerId !== userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const invites = await db.workspaceInvite.findMany({
        where: { workspaceId: request.params.workspaceId },
        orderBy: { createdAt: 'desc' }
      });

      return invites;
    }
  );

  fastify.delete<{ Params: { workspaceId: string; inviteId: string } }>(
    '/:workspaceId/invites/:inviteId',
    async (request: FastifyRequest<{ Params: { workspaceId: string; inviteId: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;

      const workspace = await db.workspace.findUnique({
        where: { id: request.params.workspaceId }
      });

      if (!workspace || workspace.ownerId !== userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      await db.workspaceInvite.delete({
        where: { id: request.params.inviteId }
      });

      return { success: true };
    }
  );

  fastify.put<{ Params: { workspaceId: string; memberId: string } }>(
    '/:workspaceId/members/:memberId',
    async (request: FastifyRequest<{ Params: { workspaceId: string; memberId: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const body = updateMemberSchema.parse(request.body);

      const workspace = await db.workspace.findUnique({
        where: { id: request.params.workspaceId }
      });

      if (!workspace || workspace.ownerId !== userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      if (request.params.memberId === workspace.ownerId) {
        return reply.code(400).send({ error: 'Cannot change owner role' });
      }

      const member = await db.user.findUnique({
        where: { id: request.params.memberId }
      });

      if (!member) {
        return reply.code(404).send({ error: 'Member not found' });
      }

      await db.user.update({
        where: { id: request.params.memberId },
        data: {
          workspaces: {
            disconnect: { id: workspace.id },
            connect: { id: workspace.id }
          }
        }
      });

      return { success: true, role: body.role };
    }
  );

  fastify.delete<{ Params: { workspaceId: string; memberId: string } }>(
    '/:workspaceId/members/:memberId',
    async (request: FastifyRequest<{ Params: { workspaceId: string; memberId: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;

      const workspace = await db.workspace.findUnique({
        where: { id: request.params.workspaceId }
      });

      if (!workspace || workspace.ownerId !== userId) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      if (request.params.memberId === workspace.ownerId) {
        return reply.code(400).send({ error: 'Cannot remove owner' });
      }

      await db.user.update({
        where: { id: request.params.memberId },
        data: {
          workspaces: {
            disconnect: { id: workspace.id }
          }
        }
      });

      return { success: true };
    }
  );
}