"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockPanel = void 0;
const react_1 = __importDefault(require("react"));
const DockData_1 = require("./DockData");
const DockTabs_1 = require("./DockTabs");
const DragDropDiv_1 = require("./dragdrop/DragDropDiv");
const DragManager_1 = require("./dragdrop/DragManager");
const DockDropLayer_1 = require("./DockDropLayer");
const Algorithm_1 = require("./Algorithm");
const DockDropEdge_1 = require("./DockDropEdge");
class DockPanel extends react_1.default.PureComponent {
    constructor() {
        super(...arguments);
        this.getRef = (r) => {
            this._ref = r;
        };
        this.state = { dropFromPanel: null, draggingHeader: false };
        this.onDragOver = (e) => {
            if (DockPanel._droppingPanel === this) {
                return;
            }
            let { panelData } = this.props;
            let dockId = this.context.getDockId();
            let tab = DragManager_1.DragState.getData('tab', dockId);
            let panel = DragManager_1.DragState.getData('panel', dockId);
            if (tab || panel) {
                DockPanel.droppingPanel = this;
            }
            if (tab) {
                if (tab.parent) {
                    this.setState({ dropFromPanel: tab.parent });
                }
                else {
                    // add a fake panel
                    this.setState({ dropFromPanel: { activeId: '', tabs: [], group: tab.group } });
                }
            }
            else if (panel) {
                this.setState({ dropFromPanel: panel });
            }
        };
        // drop to move in float mode
        this.onPanelHeaderDragStart = (event) => {
            let { panelData } = this.props;
            let { parent, x, y, z } = panelData;
            let dockId = this.context.getDockId();
            if (parent && parent.mode === 'float') {
                this._movingX = x;
                this._movingY = y;
                // hide the panel, but not create drag layer element
                event.setData({ panel: this.props.panelData }, dockId);
                event.startDrag(null, null);
                this.onFloatPointerDown();
            }
            else {
                let tabGroup = this.context.getGroup(panelData.group);
                let [panelWidth, panelHeight] = (0, Algorithm_1.getFloatPanelSize)(this._ref, tabGroup);
                event.setData({ panel: panelData, panelSize: [panelWidth, panelHeight] }, dockId);
                event.startDrag(null);
            }
            this.setState({ draggingHeader: true });
        };
        this.onPanelHeaderDragMove = (e) => {
            let { width, height } = this.context.getLayoutSize();
            let { panelData } = this.props;
            panelData.x = this._movingX + e.dx;
            panelData.y = this._movingY + e.dy;
            if (width > 200 && height > 200) {
                if (panelData.y < 0) {
                    panelData.y = 0;
                }
                else if (panelData.y > height - 16) {
                    panelData.y = height - 16;
                }
                if (panelData.x + panelData.w < 16) {
                    panelData.x = 16 - panelData.w;
                }
                else if (panelData.x > width - 16) {
                    panelData.x = width - 16;
                }
            }
            this.forceUpdate();
        };
        this.onPanelHeaderDragEnd = (e) => {
            if (!this._unmounted) {
                this.setState({ draggingHeader: false });
                this.context.onSilentChange(this.props.panelData.activeId, 'move');
            }
        };
        this._initX = 0;
        this._initY = 0;
        this.onPanelCornerDragTL = (e) => {
            this.onPanelCornerDrag(e, 'tl');
        };
        this.onPanelCornerDragTR = (e) => {
            this.onPanelCornerDrag(e, 'tr');
        };
        this.onPanelCornerDragBL = (e) => {
            this.onPanelCornerDrag(e, 'bl');
        };
        this.onPanelCornerDragBR = (e) => {
            this.onPanelCornerDrag(e, 'br');
        };
        this.onPanelEdgeStartDragR = (e) => this.onPanelEdgeDragStart(e, "r");
        this.onPanelEdgeStartDragB = (e) => this.onPanelEdgeDragStart(e, "b");
        this.onPanelEdgeStartDragL = (e) => this.onPanelEdgeDragStart(e, "l");
        this.onPanelEdgeStartDragT = (e) => this.onPanelEdgeDragStart(e, "t");
        this.onPanelEdgeDragMove = (e) => {
            let { panelData } = this.props;
            if (e.screenX <= 0 || e.screenY <= 0)
                return; // no idea why this happens, but eh
            let dx = e.screenX - this._initX;
            let dy = e.screenY - this._initY;
            if (this._movingEdge == 't') {
                // when moving top edge, dont let it move header out of screen
                let { width, height } = this.context.getLayoutSize();
                if (this._movingY + dy < 0) {
                    dy = -this._movingY;
                }
                else if (this._movingY + dy > height - 16) {
                    dy = height - 16 - this._movingY;
                }
            }
            switch (this._movingEdge) {
                case 't': {
                    panelData.y = this._movingY + dy;
                    panelData.h = Math.max(this._movingH - dy, 0);
                    break;
                }
                case 'r': {
                    panelData.w = Math.max(this._movingW + dx, 0);
                    break;
                }
                case 'b': {
                    panelData.h = Math.max(this._movingH + dy, 0);
                    break;
                }
                case 'l': {
                    panelData.x = this._movingX + dx;
                    panelData.w = Math.max(this._movingW - dx, 0);
                    break;
                }
            }
            this.forceUpdate();
        };
        this.onPanelEdgeDragEnd = (e) => {
            this._movingEdge = null;
            this._initX = 0;
            this._initY = 0;
            this.context.onSilentChange(this.props.panelData.activeId, 'move');
        };
        this.onPanelCornerDragMove = (e) => {
            let { panelData } = this.props;
            let { dx, dy } = e;
            if (this._movingCorner.startsWith('t')) {
                // when moving top corners, dont let it move header out of screen
                let { width, height } = this.context.getLayoutSize();
                if (this._movingY + dy < 0) {
                    dy = -this._movingY;
                }
                else if (this._movingY + dy > height - 16) {
                    dy = height - 16 - this._movingY;
                }
            }
            switch (this._movingCorner) {
                case 'tl': {
                    panelData.x = this._movingX + dx;
                    panelData.w = this._movingW - dx;
                    panelData.y = this._movingY + dy;
                    panelData.h = this._movingH - dy;
                    break;
                }
                case 'tr': {
                    panelData.w = this._movingW + dx;
                    panelData.y = this._movingY + dy;
                    panelData.h = this._movingH - dy;
                    break;
                }
                case 'bl': {
                    panelData.x = this._movingX + dx;
                    panelData.w = this._movingW - dx;
                    panelData.h = this._movingH + dy;
                    break;
                }
                case 'br': {
                    panelData.w = this._movingW + dx;
                    panelData.h = this._movingH + dy;
                    break;
                }
            }
            this.forceUpdate();
        };
        this.onPanelCornerDragEnd = (e) => {
            this.context.onSilentChange(this.props.panelData.activeId, 'move');
        };
        this.onFloatPointerDown = () => {
            let { panelData } = this.props;
            let { z } = panelData;
            let newZ = (0, Algorithm_1.nextZIndex)(z);
            if (newZ !== z) {
                panelData.z = newZ;
                this.forceUpdate();
            }
        };
        this.onPanelClicked = (e) => {
            const target = e.nativeEvent.target;
            if (!this._ref.contains(this._ref.ownerDocument.activeElement) && target instanceof Node && this._ref.contains(target)) {
                this._ref.querySelector('.dock-bar').focus();
            }
        };
        this._baseEdgeDragStyle = {
            opacity: 0,
            position: 'absolute',
            zIndex: 299,
            userSelect: 'none',
        };
        this._unmounted = false;
    }
    static set droppingPanel(panel) {
        if (DockPanel._droppingPanel === panel) {
            return;
        }
        if (DockPanel._droppingPanel) {
            DockPanel._droppingPanel.onDragOverOtherPanel();
        }
        DockPanel._droppingPanel = panel;
    }
    onDragOverOtherPanel() {
        if (this.state.dropFromPanel) {
            this.setState({ dropFromPanel: null });
        }
    }
    onPanelEdgeDragStart(e, edge) {
        let { parent, x, y, w, h } = this.props.panelData;
        if (parent && parent.mode === 'float') {
            this._movingEdge = edge;
            this._initX = e.screenX;
            this._initY = e.screenY;
            this._movingX = x;
            this._movingY = y;
            this._movingW = w;
            this._movingH = h;
            // hide drag image preview
            var dummyDragImage = new Image();
            dummyDragImage.style.display = "none"; /* or visibility: hidden, or any of the above */
            document.body.appendChild(dummyDragImage);
            e.dataTransfer.setDragImage(dummyDragImage, 0, 0);
        }
    }
    onPanelCornerDrag(e, corner) {
        let { parent, x, y, w, h } = this.props.panelData;
        if (parent && parent.mode === 'float') {
            this._movingCorner = corner;
            this._movingX = x;
            this._movingY = y;
            this._movingW = w;
            this._movingH = h;
            e.startDrag(null, null);
        }
    }
    render() {
        let { dropFromPanel, draggingHeader } = this.state;
        let { panelData, size } = this.props;
        let { minWidth, minHeight, group, id, parent, panelLock } = panelData;
        let styleName = group;
        let tabGroup = this.context.getGroup(group);
        let { widthFlex, heightFlex } = tabGroup;
        if (panelLock) {
            let { panelStyle, widthFlex: panelWidthFlex, heightFlex: panelHeightFlex } = panelLock;
            if (panelStyle) {
                styleName = panelStyle;
            }
            if (typeof panelWidthFlex === 'number') {
                widthFlex = panelWidthFlex;
            }
            if (typeof panelHeightFlex === 'number') {
                heightFlex = panelHeightFlex;
            }
        }
        let panelClass;
        if (styleName) {
            panelClass = styleName
                .split(' ')
                .map((name) => `dock-style-${name}`)
                .join(' ');
        }
        let isMax = (parent === null || parent === void 0 ? void 0 : parent.mode) === 'maximize';
        let isFloat = (parent === null || parent === void 0 ? void 0 : parent.mode) === 'float';
        let isHBox = (parent === null || parent === void 0 ? void 0 : parent.mode) === 'horizontal';
        let isVBox = (parent === null || parent === void 0 ? void 0 : parent.mode) === 'vertical';
        let pointerDownCallback = this.onFloatPointerDown;
        let onPanelHeaderDragStart = this.onPanelHeaderDragStart;
        if (!isFloat || isMax) {
            pointerDownCallback = null;
        }
        if (isMax) {
            dropFromPanel = null;
            onPanelHeaderDragStart = null;
        }
        let cls = `dock-panel ${panelClass ? panelClass : ''}${dropFromPanel ? ' dock-panel-dropping' : ''}${draggingHeader ? ' dragging' : ''}`;
        let flex = 1;
        if (isHBox && widthFlex != null) {
            flex = widthFlex;
        }
        else if (isVBox && heightFlex != null) {
            flex = heightFlex;
        }
        let flexGrow = flex * size;
        let flexShrink = flex * 1000000;
        if (flexShrink < 1) {
            flexShrink = 1;
        }
        let style = { minWidth, minHeight, flex: `${flexGrow} ${flexShrink} ${size}px` };
        if (isFloat) {
            style.left = panelData.x;
            style.top = panelData.y;
            style.width = panelData.w;
            style.height = panelData.h;
            style.zIndex = panelData.z;
        }
        let droppingLayer;
        if (dropFromPanel) {
            let dropFromGroup = this.context.getGroup(dropFromPanel.group);
            let dockId = this.context.getDockId();
            if (!dropFromGroup.tabLocked || DragManager_1.DragState.getData('tab', dockId) == null) {
                // not allowed locked tab to create new panel
                let DockDropClass = this.context.useEdgeDrop() ? DockDropEdge_1.DockDropEdge : DockDropLayer_1.DockDropLayer;
                droppingLayer = react_1.default.createElement(DockDropClass, { panelData: panelData, panelElement: this._ref, dropFromPanel: dropFromPanel });
            }
        }
        return (react_1.default.createElement(DragDropDiv_1.DragDropDiv, { getRef: this.getRef, className: cls, style: style, "data-dockid": id, onMouseDownCapture: pointerDownCallback, onTouchStartCapture: pointerDownCallback, onDragOverT: isFloat ? null : this.onDragOver, onClick: this.onPanelClicked },
            react_1.default.createElement(DockTabs_1.DockTabs, { panelData: panelData, onPanelDragStart: onPanelHeaderDragStart, onPanelDragMove: this.onPanelHeaderDragMove, onPanelDragEnd: this.onPanelHeaderDragEnd }),
            isFloat ?
                [
                    react_1.default.createElement(DragDropDiv_1.DragDropDiv, { key: "drag-size-t-l", className: "dock-panel-drag-size dock-panel-drag-size-t-l", onDragStartT: this.onPanelCornerDragTL, onDragMoveT: this.onPanelCornerDragMove, onDragEndT: this.onPanelCornerDragEnd }),
                    react_1.default.createElement(DragDropDiv_1.DragDropDiv, { key: "drag-size-t-r", className: "dock-panel-drag-size dock-panel-drag-size-t-r", onDragStartT: this.onPanelCornerDragTR, onDragMoveT: this.onPanelCornerDragMove, onDragEndT: this.onPanelCornerDragEnd }),
                    react_1.default.createElement(DragDropDiv_1.DragDropDiv, { key: "drag-size-b-l", className: "dock-panel-drag-size dock-panel-drag-size-b-l", onDragStartT: this.onPanelCornerDragBL, onDragMoveT: this.onPanelCornerDragMove, onDragEndT: this.onPanelCornerDragEnd }),
                    react_1.default.createElement(DragDropDiv_1.DragDropDiv, { key: "drag-size-b-r", className: "dock-panel-drag-size dock-panel-drag-size-b-r", onDragStartT: this.onPanelCornerDragBR, onDragMoveT: this.onPanelCornerDragMove, onDragEndT: this.onPanelCornerDragEnd }),
                    react_1.default.createElement("div", { key: 'DragEdgeR', style: Object.assign(Object.assign({}, this._baseEdgeDragStyle), { right: -3.5, height: '100%', width: 7, cursor: 'e-resize' }), draggable: true, onDragStart: this.onPanelEdgeStartDragR, onDrag: this.onPanelEdgeDragMove, onDragEnd: this.onPanelEdgeDragEnd, onMouseUp: this.onPanelEdgeDragEnd }),
                    react_1.default.createElement("div", { key: 'DragEdgeB', style: Object.assign(Object.assign({}, this._baseEdgeDragStyle), { bottom: -3.5, width: '100%', height: 7, cursor: 's-resize' }), draggable: true, onDragStart: this.onPanelEdgeStartDragB, onDrag: this.onPanelEdgeDragMove, onDragEnd: this.onPanelEdgeDragEnd, onMouseUp: this.onPanelEdgeDragEnd }),
                    react_1.default.createElement("div", { key: 'DragEdgeL', style: Object.assign(Object.assign({}, this._baseEdgeDragStyle), { left: -3.5, height: '100%', width: 7, cursor: 'w-resize' }), draggable: true, onDragStart: this.onPanelEdgeStartDragL, onDrag: this.onPanelEdgeDragMove, onDragEnd: this.onPanelEdgeDragEnd, onMouseUp: this.onPanelEdgeDragEnd }),
                    react_1.default.createElement("div", { key: 'DragEdgeT', style: Object.assign(Object.assign({}, this._baseEdgeDragStyle), { top: -3.5, width: '100%', height: 7, cursor: 'n-resize' }), draggable: true, onDragStart: this.onPanelEdgeStartDragT, onDrag: this.onPanelEdgeDragMove, onDragEnd: this.onPanelEdgeDragEnd, onMouseUp: this.onPanelEdgeDragEnd })
                ]
                : null,
            droppingLayer));
    }
    componentWillUnmount() {
        if (DockPanel._droppingPanel === this) {
            DockPanel.droppingPanel = null;
        }
        this._unmounted = true;
    }
}
exports.DockPanel = DockPanel;
DockPanel.contextType = DockData_1.DockContextType;
