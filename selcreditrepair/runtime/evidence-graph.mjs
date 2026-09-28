export class EvidenceGraph{
  constructor(){this.nodes=new Map();this.edges=[]}
  addNode(node){if(!node?.id||!node?.type)throw new Error("INVALID_NODE");if(this.nodes.has(node.id))throw new Error(`DUPLICATE_NODE:${node.id}`);this.nodes.set(node.id,Object.freeze({...node}))}
  addEdge(edge){if(!edge?.from||!edge?.to||!edge?.type)throw new Error("INVALID_EDGE");if(!this.nodes.has(edge.from)||!this.nodes.has(edge.to))throw new Error("EDGE_ENDPOINT_MISSING");this.edges.push(Object.freeze({...edge}))}
  hasNode(id){return this.nodes.has(id)}
  snapshot(){return Object.freeze({nodes:[...this.nodes.values()],edges:[...this.edges]})}
}
