// snatched from three.js

/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 * @author njbrown /  https://twitter.com/njbrown
 */

import { Geometry } from "three";
import { BufferGeometry } from "three";
import { Float32BufferAttribute } from "three";
import { Vector3 } from "three";

class CylinderGeometry extends Geometry {
  parameters = {};

  constructor(
    radiusTop?,
    radiusBottom?,
    height?,
    radialSegments?,
    heightSegments?,
    openEnded?,
    thetaStart?,
    thetaLength?
  ) {
    super();

    this.type = "CylinderGeometry";

    this.parameters = {
      radiusTop: radiusTop,
      radiusBottom: radiusBottom,
      height: height,
      radialSegments: radialSegments,
      heightSegments: heightSegments,
      openEnded: openEnded,
      thetaStart: thetaStart,
      thetaLength: thetaLength,
    };

    this.fromBufferGeometry(
      new CylinderBufferGeometry(
        radiusTop,
        radiusBottom,
        height,
        radialSegments,
        heightSegments,
        openEnded,
        thetaStart,
        thetaLength
      )
    );
    this.mergeVertices();
  }
}

class CylinderBufferGeometry extends BufferGeometry {
  parameters = {};
  constructor(
    radiusTop?,
    radiusBottom?,
    height?,
    radialSegments?,
    heightSegments?,
    openEnded?,
    thetaStart?,
    thetaLength?
  ) {
    super();

    this.type = "CylinderBufferGeometry";

    this.parameters = {
      radiusTop: radiusTop,
      radiusBottom: radiusBottom,
      height: height,
      radialSegments: radialSegments,
      heightSegments: heightSegments,
      openEnded: openEnded,
      thetaStart: thetaStart,
      thetaLength: thetaLength,
    };

    let scope = this;

    radiusTop = radiusTop !== undefined ? radiusTop : 1;
    radiusBottom = radiusBottom !== undefined ? radiusBottom : 1;
    height = height || 1;

    radialSegments = Math.floor(radialSegments) || 8;
    heightSegments = Math.floor(heightSegments) || 1;

    openEnded = openEnded !== undefined ? openEnded : false;
    thetaStart = thetaStart !== undefined ? thetaStart : 0.0;
    thetaLength = thetaLength !== undefined ? thetaLength : Math.PI * 2;

    // buffers

    let indices = [];
    let vertices = [];
    let normals = [];
    let uvs = [];

    // helper variables

    let index = 0;
    let indexArray = [];
    let halfHeight = height / 2;
    let groupStart = 0;

    // generate geometry

    generateTorso();

    // open-ended by default
    // if (openEnded === false) {
    // 	if (radiusTop > 0) generateCap(true);
    // 	if (radiusBottom > 0) generateCap(false);
    // }

    // build geometry

    this.setIndex(indices);
    this.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    this.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

    function generateTorso() {
      let x, y;
      let normal = new Vector3();
      let vertex = new Vector3();

      let groupCount = 0;

      // this will be used to calculate the normal
      let slope = (radiusBottom - radiusTop) / height;

      // generate vertices, normals and uvs

      for (y = 0; y <= heightSegments; y++) {
        let indexRow = [];

        let v = y / heightSegments;

        // calculate the radius of the current row

        let radius = v * (radiusBottom - radiusTop) + radiusTop;

        for (x = 0; x <= radialSegments; x++) {
          let u = x / radialSegments;

          let theta = u * thetaLength + thetaStart;

          let sinTheta = Math.sin(theta);
          let cosTheta = Math.cos(theta);

          // vertex

          vertex.x = radius * sinTheta;
          vertex.y = -v * height + halfHeight;
          vertex.z = radius * cosTheta;
          vertices.push(vertex.x, vertex.y, vertex.z);

          // normal

          normal.set(sinTheta, slope, cosTheta).normalize();
          normals.push(normal.x, normal.y, normal.z);

          // uv

          uvs.push(u * 4, 1 - v);

          // save index of vertex in respective row

          indexRow.push(index++);
        }

        // now save vertices of the row in our index array

        indexArray.push(indexRow);
      }

      // generate indices

      for (x = 0; x < radialSegments; x++) {
        for (y = 0; y < heightSegments; y++) {
          // we use the index array to access the correct indices

          let a = indexArray[y][x];
          let b = indexArray[y + 1][x];
          let c = indexArray[y + 1][x + 1];
          let d = indexArray[y][x + 1];

          // faces

          indices.push(a, b, d);
          indices.push(b, c, d);

          // update group counter

          groupCount += 6;
        }
      }

      // add a group to the geometry. this will ensure multi material support

      scope.addGroup(groupStart, groupCount, 0);

      // calculate new start value for groups

      groupStart += groupCount;
    }
  }
}

export { CylinderGeometry, CylinderBufferGeometry };
