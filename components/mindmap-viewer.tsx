'use client';

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react';
/// <reference types="@xyflow/react/dist/style.css" />
import '@xyflow/react/dist/style.css';
import { KnowledgeTree, Topic } from '@/lib/types';

interface MindmapViewerProps {
  tree: KnowledgeTree;
  onNodeClick?: (topicId: string, topicName: string) => void;
}

function buildNodesAndEdges(tree: KnowledgeTree) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Root node
  const rootId = 'root';
  nodes.push({
    id: rootId,
    position: { x: 400, y: 50 },
    data: { label: tree.title },
    type: 'default',
    style: {
      background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      padding: '16px 24px',
      fontWeight: 700,
      fontSize: '16px',
      boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
    },
  });

  const addTopics = (
    topics: Topic[],
    parentId: string,
    depth: number,
    startX: number,
    startY: number
  ) => {
    const spacing = Math.max(280, 400 / (depth + 1));
    const totalWidth = (topics.length - 1) * spacing;
    const offsetX = startX - totalWidth / 2;

    topics.forEach((topic, index) => {
      const x = offsetX + index * spacing;
      const y = startY + 140;

      nodes.push({
        id: topic.id,
        position: { x, y },
        data: {
          label: topic.name,
          summary: topic.summary,
          keyConcepts: topic.keyConcepts,
        },
        style: {
          background: depth === 0
            ? 'rgba(168, 85, 247, 0.15)'
            : 'rgba(168, 85, 247, 0.08)',
          color: '#e9d5ff',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '12px',
          padding: '12px 18px',
          fontWeight: depth === 0 ? 600 : 500,
          fontSize: depth === 0 ? '14px' : '13px',
          maxWidth: '200px',
          textAlign: 'center' as const,
        },
      });

      edges.push({
        id: `${parentId}-${topic.id}`,
        source: parentId,
        target: topic.id,
        style: { stroke: '#a855f7', strokeWidth: 2 },
        animated: depth === 0,
      });

      if (topic.subtopics && topic.subtopics.length > 0) {
        addTopics(topic.subtopics, topic.id, depth + 1, x, y);
      }
    });
  };

  if (tree.topics.length > 0) {
    addTopics(tree.topics, rootId, 0, 400, 50);
  }

  return { nodes, edges };
}

export default function MindmapViewer({ tree, onNodeClick }: MindmapViewerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNodesAndEdges(tree),
    [tree]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick && node.id !== 'root') {
        onNodeClick(node.id, String(node.data.label));
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-white/10 bg-surface-dark">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        <Controls
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }}
        />
        <MiniMap
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }}
          maskColor="rgba(0,0,0,0.7)"
          nodeColor="#a855f7"
        />
      </ReactFlow>
    </div>
  );
}
