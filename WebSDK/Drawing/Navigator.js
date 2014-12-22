"use strict";

/**
 * Copyright 2014 the HtmlGoBoard project authors.
 * All rights reserved.
 * Project  WebSDK
 * Author   Ilya Kirillov
 * Date     30.11.14
 * Time     0:52
 */

function CDrawingNavigator(oDrawing)
{
    this.m_oDrawing  = oDrawing;
    this.m_oGameTree = null;
    this.m_oMap      = new CNavigatorMap();

    this.m_bNeedRedrawCurrent = true;
    this.m_bNeedRedrawMap     = true;

    this.HtmlElement =
    {
        Control     : null,

        Board       : {Control : null},
        Selection   : {Control : null},
        Current     : {Control : null},
        Lines       : {Control : null},
        Shadows     : {Control : null},
        Nodes       : {Control : null},
        Events      : {Control : null},
        HorScroll   : null,
        VerScroll   : null,
        HorScrollBG : null,
        VerScrollBG : null,
        ScrollW     : 0,
        ScrollH     : 0
    };


    this.m_bTrueColorBoard   = true;
    this.m_bTrueColorStones  = true;
    this.m_bShadows          = true;
    this.m_oWhiteColor       = new CColor(255, 255, 255, 255);
    this.m_oBlackColor       = new CColor(0, 0, 0, 255);
    this.m_oBoardColor       = new CColor(231, 188, 95, 255);
    this.m_oLinesColor       = new CColor(0, 0, 0, 255);
    this.m_bDarkBoard        = false;

    this.m_oCreateWoodyId = null;
    this.m_oImageData =
    {
        W             : 0,
        H             : 0,
        Board         : null,
        Black         : null,
        White         : null,
        BlackT        : null,
        WhiteT        : null,
        Hor_Start     : null,
        Hor_Start2    : null,
        Hor           : null,
        Hor2          : null,
        Hor_End       : null,
        Ver           : null,
        Ver2          : null,
        Ver3          : null,
        Hor_Start_T   : null,
        Hor_Start2_T  : null,
        Hor_Start2_T_2: null,
        Hor_Start2_T_3: null,
        Hor_T         : null,
        Hor2_T        : null,
        Hor2_T_2      : null,
        Hor2_T_3      : null,
        Hor_End_T     : null,
        Ver_T         : null,
        Ver2_T        : null,
        Ver2_T_2      : null,
        Ver2_T_3      : null,
        Ver3_T        : null,
        Triangle      : null,
        Triangle_T    : null,
        Triangle_B    : null,
        Triangle_W    : null,
        Triangle_BT   : null,
        Triangle_WT   : null,
        Target        : null,
        Current       : null,
        Shadow        : null,
        ShadowOff     : 0
    };

    this.m_oOffset = {X : 0, Y : 0};
    this.m_bMouseLock       = false;
    this.m_bNavigatorScroll = true;


    this.m_oLastDrawMap =
    {
        W : 0,
        H : 0,
        X : 0,
        Y : 0
    };

    var oThis = this;

    this.private_StartDrawingTimer = function()
    {
        return setTimeout(function()
        {
            oThis.private_CreateTrueColorBoard();
        }, 20);
    };

    this.private_OnMouseDown = function(e)
    {
        if (oThis.m_bMouseLock)
            return;

        if (oThis.m_oGameTree)
            oThis.m_oGameTree.Focus();

        check_MouseDownEvent(e, true);
        var oPos = oThis.private_UpdateMousePos(global_mouseEvent.X, global_mouseEvent.Y);

        var Value = oThis.m_oMap.Get(oPos.X, oPos.Y);
        if (Value.Is_Node() && oThis.m_oGameTree)
            oThis.m_oGameTree.GoTo_Node(Value);
    };

    this.private_OnMouseMove = function(e)
    {
        if (oThis.m_bMouseLock)
            return;

        check_MouseMoveEvent(e);
        var oPos = oThis.private_UpdateMousePos(global_mouseEvent.X, global_mouseEvent.Y);
        oThis.private_UpdateTarget(oPos.X, oPos.Y);
    };

    this.private_OnMouseOut = function(e)
    {
        if (oThis.m_bMouseLock)
            return;

        oThis.private_UpdateTarget(-1, -1);
    };

    this.private_OnMouseWheel = function(Event)
    {
        if (oThis.m_bMouseLock)
            return false;

        var delta = 0;

        if (undefined != Event.wheelDelta)
            delta = (Event.wheelDelta > 0) ? -45 : 45;
        else
            delta = (Event.detail > 0) ? 45 : -45;

        if (Event.preventDefault)
            Event.preventDefault();

        var YOffset = delta;

        var LogicYMax  = oThis.m_oMap.Get_Height() + 1;
        var NavH       = oThis.HtmlElement.Board.Control.HtmlElement.height;
        var YMaxOffset = (20 + LogicYMax * 24 - NavH);

        oThis.m_oOffset.Y -= YOffset;
        oThis.m_oOffset.Y = Math.min(0, Math.max(oThis.m_oOffset.Y, -YMaxOffset));

        oThis.private_DrawMap();
        oThis.private_OnMouseMove(Event);
        oThis.private_UpdateScrollsPos();

        return false;
    };

    this.private_OnFocus = function()
    {
        if (oThis.m_oGameTree)
            oThis.m_oGameTree.Focus();
    };

    this.private_OnMouseOverHorScroll = function()
    {
        oThis.HtmlElement.HorScroll.style.opacity   = 0.7;
        oThis.HtmlElement.HorScrollBG.style.opacity = 0.3;
        oThis.HtmlElement.HorScrollBG.style.display = "block";
    };

    this.private_OnMouseOutHorScroll = function()
    {
        oThis.HtmlElement.HorScroll.style.opacity   = 0.5;
        oThis.HtmlElement.HorScrollBG.style.opacity = 0;
        oThis.HtmlElement.HorScrollBG.style.display = "none";
    };

    this.private_OnMouseOverVerScroll = function()
    {
        oThis.HtmlElement.VerScroll.style.opacity   = 0.7;
        oThis.HtmlElement.VerScrollBG.style.opacity = 0.3;
        oThis.HtmlElement.VerScrollBG.style.display = "block";
    };

    this.private_OnMouseOutVerScroll = function()
    {
        oThis.HtmlElement.VerScroll.style.opacity   = 0.5;
        oThis.HtmlElement.VerScrollBG.style.opacity = 0;
        oThis.HtmlElement.VerScrollBG.style.display = "none";
    };

    this.private_OnDragStartScroll = function()
    {
        oThis.m_bMouseLock = true;
    };

    this.private_OnDragEndScroll = function()
    {
        oThis.m_bMouseLock = false;
    };

    this.private_OnDragHorScroll = function(X, Y)
    {
        X -= 2;
        var LogicXMax = oThis.m_oMap.Get_Width() + 1;
        var ScrollW   = oThis.HtmlElement.ScrollW;
        var NavW      = oThis.m_oImageData.W;

        var XOffset = (20 + LogicXMax * 24 - NavW) * (X / (NavW - 4 - ScrollW));
        oThis.m_oOffset.X = -XOffset;
        oThis.private_DrawMap();
    };

    this.private_OnDragVerScroll = function(X, Y)
    {
        Y -= 2;
        var LogicYMax = oThis.m_oMap.Get_Height() + 1;
        var ScrollH   = oThis.HtmlElement.ScrollH;
        var NavH      = oThis.m_oImageData.H;

        var YOffset = (20 + LogicYMax * 24 - NavH) * (Y / (NavH - 4 - ScrollH));
        oThis.m_oOffset.Y = -YOffset;
        oThis.private_DrawMap();
    };
}

CDrawingNavigator.prototype.Init = function(sDivId, oGameTree)
{
    if (this.m_oDrawing)
        this.m_oDrawing.Register_Navigator(this);

    this.m_oGameTree = oGameTree;
    this.m_oGameTree.Set_DrawingNavigator(this);
    this.m_oMap.Set_GameTree(oGameTree);

    this.HtmlElement.Control = CreateControlContainer(sDivId);
    var oMainElement = this.HtmlElement.Control.HtmlElement;
    var oMainControl = this.HtmlElement.Control;

    var sBoardName     = sDivId + "_Board";
    var sSelectionName = sDivId + "_Selection";
    var sCurrentName   = sDivId + "_Current";
    var sLinesName     = sDivId + "_Lines";
    var sShadowsName   = sDivId + "_Shadows";
    var sNodesName     = sDivId + "_Nodes";
    var sEventsName    = sDivId + "_Events";

    this.private_CreateCanvasElement(oMainElement, sBoardName);
    this.private_CreateCanvasElement(oMainElement, sSelectionName);
    this.private_CreateCanvasElement(oMainElement, sCurrentName);
    this.private_CreateCanvasElement(oMainElement, sLinesName);
    this.private_CreateCanvasElement(oMainElement, sShadowsName);
    this.private_CreateCanvasElement(oMainElement, sNodesName);
    var oEventDiv = this.private_CreateDivElement(oMainElement, sEventsName);

    this.HtmlElement.HorScrollBG = this.private_CreateDivElement(oMainElement, sDivId + "HorScroll_BG");
    this.HtmlElement.HorScroll   = this.private_CreateDivElement(oMainElement, sDivId + "HorScroll");
    this.HtmlElement.VerScrollBG = this.private_CreateDivElement(oMainElement, sDivId + "VerScroll_BG");
    this.HtmlElement.VerScroll   = this.private_CreateDivElement(oMainElement, sDivId + "VerScroll");

    this.HtmlElement.HorScrollBG.style.background = "rgb(0,0,0)";
    this.HtmlElement.HorScrollBG.style.display = "none";
    this.HtmlElement.VerScrollBG.style.background = "rgb(0,0,0)";
    this.HtmlElement.VerScrollBG.style.display = "none";

    this.HtmlElement.HorScroll['onmouseover'] = this.private_OnMouseOverHorScroll;
    this.HtmlElement.HorScroll['onmouseout']  = this.private_OnMouseOutHorScroll;
    this.HtmlElement.VerScroll['onmouseover'] = this.private_OnMouseOverVerScroll;
    this.HtmlElement.VerScroll['onmouseout']  = this.private_OnMouseOutVerScroll;

    var oHorScroll = CreateControlContainer(sDivId + "HorScroll_BG");
    oHorScroll.Bounds.SetParams(2, 0, 2, 4, true, false, true, true, -1, 8);
    oHorScroll.Anchor = (g_anchor_left | g_anchor_bottom | g_anchor_right);
    oMainControl.AddControl(oHorScroll);

    var oVerScroll = CreateControlContainer(sDivId + "VerScroll_BG");
    oVerScroll.Bounds.SetParams(0, 2, 4, 2, false, true, true, true, 8, -1);
    oVerScroll.Anchor = (g_anchor_top | g_anchor_bottom | g_anchor_right);
    oMainControl.AddControl(oVerScroll);

    this.private_FillHtmlElement(this.HtmlElement.Board,     oMainControl, sBoardName);
    this.private_FillHtmlElement(this.HtmlElement.Selection, oMainControl, sSelectionName);
    this.private_FillHtmlElement(this.HtmlElement.Current,   oMainControl, sCurrentName);
    this.private_FillHtmlElement(this.HtmlElement.Lines,     oMainControl, sLinesName);
    this.private_FillHtmlElement(this.HtmlElement.Shadows,   oMainControl, sShadowsName);
    this.private_FillHtmlElement(this.HtmlElement.Nodes,     oMainControl, sNodesName);
    this.private_FillHtmlElement(this.HtmlElement.Events,    oMainControl, sEventsName);

    oEventDiv.onmousedown     = this.private_OnMouseDown;
    oEventDiv.onmousemove     = this.private_OnMouseMove;
    oEventDiv.onmouseout      = this.private_OnMouseOut;
    oEventDiv['onmousewheel'] = this.private_OnMouseWheel;
    if (oEventDiv.addEventListener)
        oEventDiv.addEventListener("DOMMouseScroll", this.private_OnMouseWheel, false);

    oEventDiv['onfocus']      = this.private_OnFocus;
    oEventDiv.tabIndex        = -1;   // Этот параметр нужен, чтобы принимать сообщения клавиатуры (чтобы на этой div вставал фокус)
    oEventDiv.style.hidefocus = true; // Убираем рамку фокуса в IE
    oEventDiv.style.outline   = 0;    // Убираем рамку фокуса в остальных браузерах

    // Сразу создаем камни и линии, потому что они у нас не зависят от размера Div.
    this.private_CreateTrueColorStones();
    this.private_CreateLines();
    this.private_CreateTarget();
    this.private_CreateShadows();
};
CDrawingNavigator.prototype.Update_All = function()
{
    this.private_CreateTrueColorStones();
    this.private_CreateLines();
    this.private_CreateTarget();
    this.private_CreateShadows();

    this.Update_Size(true);
};
CDrawingNavigator.prototype.Update_Size = function(bForce)
{
    var W = this.HtmlElement.Control.HtmlElement.clientWidth;
    var H = this.HtmlElement.Control.HtmlElement.clientHeight;

    this.HtmlElement.Control.Resize(W, H);

    this.private_OnResize(W, H, bForce);
};
CDrawingNavigator.prototype.Update = function()
{
    if (this.m_oImageData.W <= 0 || this.m_oImageData.H <= 0)
        return;

    var LogicXMax = this.m_oMap.Get_Width() + 1;
    var LogicYMax = this.m_oMap.Get_Height() + 1;

    var NavW = this.m_oImageData.W;
    var NavH = this.m_oImageData.H;

    var _NavW = 20 + LogicXMax * 24;
    var _NavH = 20 + LogicYMax * 24;
    if (_NavW > NavW)
    {
        this.HtmlElement.ScrollW                    = Math.max(50, NavW * NavW / _NavW);
        this.HtmlElement.HorScroll.style.width      = Math.max(50, NavW * NavW / _NavW) + "px";
        this.HtmlElement.HorScroll.style.display    = "block";
        this.HtmlElement.HorScroll.style.position   = "absolute";
        this.HtmlElement.HorScroll.style.top        = NavH - 12 + "px";
        this.HtmlElement.HorScroll.style.height     = 8 + "px";
        this.HtmlElement.HorScroll.style.background = this.m_bDarkBoard ? "rgb(220, 220, 220)" : "rgb(0,0,0)";
        this.HtmlElement.HorScroll.style.opacity    = 0.5;

        Common_DragHandler.Init(this.HtmlElement.HorScroll, null, 2, NavW - this.HtmlElement.ScrollW - 2, NavH - 12, NavH - 12);

        this.HtmlElement.HorScroll.onDrag         = this.private_OnDragHorScroll;
        this.HtmlElement.HorScroll.onDragStart    = this.private_OnDragStartScroll;
        this.HtmlElement.HorScroll.onDragEnd      = this.private_OnDragEndScroll;
    }
    else
    {
        this.HtmlElement.HorScroll.style.display = "none";
    }

    if (_NavH > NavH)
    {
        this.HtmlElement.ScrollH                    = Math.max(50, NavH * NavH / _NavH);
        this.HtmlElement.VerScroll.style.height     = Math.max(50, NavH * NavH / _NavH) + "px";
        this.HtmlElement.VerScroll.style.display    = "block";
        this.HtmlElement.VerScroll.style.position   = "absolute";
        this.HtmlElement.VerScroll.style.left       = NavW - 12 + "px";
        this.HtmlElement.VerScroll.style.width      = 8 + "px";
        this.HtmlElement.VerScroll.style.background = this.m_bDarkBoard ? "rgb(220, 220, 220)" : "rgb(0,0,0)";
        this.HtmlElement.VerScroll.style.opacity    = 0.5;

        Common_DragHandler.Init(this.HtmlElement.VerScroll, null, NavW - 12, NavW - 12, 2, NavH - this.HtmlElement.ScrollH - 2);

        this.HtmlElement.VerScroll.onDrag         = this.private_OnDragVerScroll;
        this.HtmlElement.VerScroll.onDragStart    = this.private_OnDragStartScroll;
        this.HtmlElement.VerScroll.onDragEnd      = this.private_OnDragEndScroll;
    }
    else
    {
        this.HtmlElement.VerScroll.style.display = "none";
    }

    // Этими строками мы сбрасываем последнее состояние отрисовщика, чтобы перерисовка точно состоялась
    this.m_oLastDrawMap.H = -1;
    this.m_oLastDrawMap.W = -1;

    this.private_DrawMap();
    this.private_UpdateScrollsPos();
};
CDrawingNavigator.prototype.Create_FromGameTree = function()
{
    this.m_oMap.Create_FromGameTree();

    // Этими строками мы сбрасываем последнее состояние отрисовщика, чтобы перерисовка точно состоялась
    this.m_oLastDrawMap.H = -1;
    this.m_oLastDrawMap.W = -1;
};
CDrawingNavigator.prototype.Update_Current = function(bScrollToCurPos)
{
    this.m_bNeedRedrawCurrent = true;

    var W = this.m_oImageData.W;
    var H = this.m_oImageData.H;

    if (W <= 0 || H <= 0)
        return;

    var oCurNodePos = this.m_oGameTree.Get_CurNode().Get_NavigatorInfo();
    var X = oCurNodePos.X, Y = oCurNodePos.Y;

    var RealX = 10 + this.m_oOffset.X + X * 24;
    var RealY = 10 + this.m_oOffset.Y + Y * 24;

    if (false != bScrollToCurPos && true === this.m_bNavigatorScroll && (RealX <= 10 || RealX >= W - 10 || RealY <= 10 || RealY >= H - 10))
    {
        var LogicYMax  = this.m_oMap.Get_Height() + 1;
        var YMaxOffset = (20 + LogicYMax * 24 - H);

        var LogicXMax  = this.m_oMap.Get_Width() + 1;
        var XMaxOffset = (20 + LogicXMax * 24 - W);

        if (RealX <= 10)
        {
            this.m_oOffset.X = -X * 24;
        }
        else if (RealX >= W - 10)
        {
            this.m_oOffset.X = W - 24 - 10 - 10 - X * 24;
        }

        if (RealY <= 10)
            this.m_oOffset.Y = -Y * 24;
        else if (RealY >= H - 10)
            this.m_oOffset.Y = H - 24 - 10 - 10 - Y * 24;

        this.m_oOffset.X = Math.min(0, Math.max(this.m_oOffset.X, -XMaxOffset));
        this.m_oOffset.Y = Math.min(0, Math.max(this.m_oOffset.Y, -YMaxOffset));

        this.private_UpdateScrollsPos();
        this.private_DrawMap();
    }
};
CDrawingNavigator.prototype.Draw = function()
{
    if (this.m_bNeedRedrawCurrent)
        this.private_DrawCurrentOnTimer();
    if (this.m_bNeedRedrawMap)
        this.private_DrawMapOnTimer();
};
CDrawingNavigator.prototype.Need_Redraw = function()
{
    if (this.m_bNeedRedrawCurrent || this.m_bNeedRedrawMap)
        return true;

    return false;
};
CDrawingNavigator.prototype.private_CreateCanvasElement = function(oParentElement, sName)
{
    var oElement = document.createElement("canvas");
    oElement.setAttribute("id", sName);
    oElement.setAttribute("style", "position:absolute;padding:0;margin:0;");
    oElement.setAttribute("oncontextmenu", "return false;");
    oParentElement.appendChild(oElement);
    return oElement;
};
CDrawingNavigator.prototype.private_CreateDivElement = function(oParentElement, sName)
{
    var oElement = document.createElement("div");
    oElement.setAttribute("id", sName);
    oElement.setAttribute("style", "position:absolute;padding:0;margin:0;");
    oElement.setAttribute("oncontextmenu", "return false;");
    oParentElement.appendChild(oElement);
    return oElement;
};
CDrawingNavigator.prototype.private_FillHtmlElement = function(oElement, oParentControl, sName)
{
    oElement.Control = CreateControlContainer(sName);
    var oControl = oElement.Control;
    oControl.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1,-1);
    oControl.Anchor = (g_anchor_top | g_anchor_left | g_anchor_bottom | g_anchor_right);
    oParentControl.AddControl(oControl);
};
CDrawingNavigator.prototype.private_OnResize = function(W, H, bForce)
{
    this.private_DrawBackground(W, H, bForce);
    this.Update();
};
CDrawingNavigator.prototype.private_DrawBackground = function(W, H, bForce)
{
    var Canvas = this.HtmlElement.Board.Control.HtmlElement.getContext("2d");
    if (W !== this.m_oImageData.W || H !== this.m_oImageData.H || null === this.m_oImageData.Board || null !== this.m_oCreateWoodyId || true === bForce)
    {
        this.m_oImageData.W = W;
        this.m_oImageData.H = H;

        Canvas.fillStyle = this.m_oBoardColor.ToString();
        Canvas.fillRect(0, 0, W, H);

        if (null !== this.m_oCreateWoodyId)
            clearTimeout(this.m_oCreateWoodyId);

        this.m_oCreateWoodyId = this.private_StartDrawingTimer();
    }
    else
    {
        Canvas.putImageData(this.m_oImageData.Board, 0, 0);
    }
};
CDrawingNavigator.prototype.private_CreateTrueColorBoard = function()
{
    this.m_oCreateWoodyId = null;

    var W = this.m_oImageData.W;
    var H = this.m_oImageData.H;
    var Canvas = this.HtmlElement.Board.Control.HtmlElement.getContext("2d");

    if (0 === W || 0 === H)
        return;

    var oImageData = Canvas.createImageData(W, H);

    var Red   = this.m_oBoardColor.r;
    var Green = this.m_oBoardColor.g;
    var Blue  = this.m_oBoardColor.b;

    var dCoffWf = new Array(W);
    for (var X = 0; X < W; X++)
        dCoffWf[X] = (Math.tan(300 * X / W) + 1) / 2 + (Math.tan(100 * X / W) + 1) / 10;

    var dCoffHf = new Array(H);
    for (var Y = 0; Y < H; Y++)
        dCoffHf[Y] = 0.02 * Math.tan(Y / H);

    var r, g, b;
    if (true === this.m_bTrueColorBoard)
    {
        var f = 9e-1;
        for (var Y = 0; Y < H; Y++)
        {
            for (var X = 0; X < W; X++)
            {
                f = (dCoffWf[X] + dCoffHf[Y]) * 40 + 0.5;
                f = f - Math.floor(f);

                if (f < 2e-1)
                    f = 1 - f / 2;
                else if (f < 4e-1)
                    f = 1 - ( 4e-1 - f ) / 2;
                else
                    f = 1;

                if (Y == H - 1 || (Y == H - 2 && X < W - 2) || X >= W - 1 || (X == W - 2 && Y < H - 1))
                    f = f / 2;

                if (Y == 0 || (Y == 1 && X > 1) || X == 0 || (X == 1 && Y > 1))
                {
                    r = 128 + Red * f / 2;
                    g = 128 + Green * f / 2;
                    b = 128 + Blue * f / 2;
                }
                else
                {
                    r = Red * f;
                    g = Green * f;
                    b = Blue * f;
                }

                var Index = (X + Y * W) * 4;
                oImageData.data[Index + 0] = r;
                oImageData.data[Index + 1] = g;
                oImageData.data[Index + 2] = b;
                oImageData.data[Index + 3] = 255;
            }
        }
    }
    else
    {
        for (var i = 0; i < H; i++)
        {
            for (var j = 0; j < W; j++)
            {
                if (i == 0  || j == 0 || i === H - 1 || j === W - 1)
                {
                    r = this.m_oLinesColor.r;
                    g = this.m_oLinesColor.g;
                    b = this.m_oLinesColor.b;
                }
                else
                {
                    r = Red;
                    g = Green;
                    b = Blue;
                }

                var Index = (j + i * W) * 4;
                oImageData.data[Index + 0] = r;
                oImageData.data[Index + 1] = g;
                oImageData.data[Index + 2] = b;
                oImageData.data[Index + 3] = 255;
            }
        }
    }
    this.m_oImageData.Board = oImageData;
    Canvas.putImageData(this.m_oImageData.Board, 0, 0);
};
CDrawingNavigator.prototype.private_CreateTrueColorStones = function()
{
    var Canvas = this.HtmlElement.Nodes.Control.HtmlElement.getContext("2d");

    var pixel = 0.8, shadow = 0.7, d = 20;
    this.m_oImageData.Black  = Canvas.createImageData(d, d);
    this.m_oImageData.White  = Canvas.createImageData(d, d);
    this.m_oImageData.BlackT = Canvas.createImageData(d, d);
    this.m_oImageData.WhiteT = Canvas.createImageData(d, d);

    var BlackBitmap  = this.m_oImageData.Black.data;
    var WhiteBitmap  = this.m_oImageData.White.data;
    var BlackTBitmap = this.m_oImageData.BlackT.data;
    var WhiteTBitmap = this.m_oImageData.WhiteT.data;

    if (true === this.m_bTrueColorStones)
    {
        var d2 = d / 2.0 - 5e-1;
        var r = d2 - 2e-1;
        var f = Math.sqrt(3);
        for (var i = 0; i < d; i++)
        {
            for (var j = 0; j < d; j++)
            {
                var di = i - d2;
                var dj = j - d2;
                var hh = r - Math.sqrt(di * di + dj * dj);
                var Index = (i * d + d - j - 1) * 4;
                if (hh >= 0)
                {
                    var z = r * r - di * di - dj * dj;

                    if (z > 0)
                        z = Math.sqrt(z) * f;
                    else
                        z = 0;

                    var x = di;
                    var y = dj;

                    var xr = Math.sqrt(6 * ( x * x + y * y + z * z ));
                    xr = (2 * z - x + y) / xr;

                    var xg = 0;

                    if (xr > 0.9)
                        xg = (xr - 0.9) * 10;

                    var alpha = 255;

                    if (hh <= pixel)
                    {
                        hh = (pixel - hh) / pixel;
                        var shade = shadow;
                        if (di - dj < r / 3)
                            shade = 1;

                        alpha = parseInt((1 - hh * shade ) * 255);
                    }

                    var g = parseInt(10 + 10 * xr + xg * 140);

                    BlackBitmap[Index + 0] = g;
                    BlackBitmap[Index + 1] = g;
                    BlackBitmap[Index + 2] = g;
                    BlackBitmap[Index + 3] = alpha;

                    BlackTBitmap[Index + 0] = g;
                    BlackTBitmap[Index + 1] = g;
                    BlackTBitmap[Index + 2] = g;
                    BlackTBitmap[Index + 3] = parseInt(alpha * 0.5);

                    g = parseInt(200 + 10 * xr + xg * 45);

                    WhiteBitmap[Index + 0] = g;
                    WhiteBitmap[Index + 1] = g;
                    WhiteBitmap[Index + 2] = g;
                    WhiteBitmap[Index + 3] = alpha;

                    WhiteTBitmap[Index + 0] = g;
                    WhiteTBitmap[Index + 1] = g;
                    WhiteTBitmap[Index + 2] = g;
                    WhiteTBitmap[Index + 3] = parseInt(alpha * 0.7);
                }
                else
                {
                    BlackBitmap[Index + 0] = 0;
                    BlackBitmap[Index + 1] = 0;
                    BlackBitmap[Index + 2] = 0;
                    BlackBitmap[Index + 3] = 0;

                    WhiteTBitmap[Index + 0] = 0;
                    WhiteTBitmap[Index + 1] = 0;
                    WhiteTBitmap[Index + 2] = 0;
                    WhiteTBitmap[Index + 3] = 0;
                }
            }
        }
    }
    else
    {
        var d2 = d / 2.0 - 5e-1;
        var r = d2 - 2e-1;

        for (var i = 0; i < d; i++)
        {
            for (var j = 0; j < d; j++)
            {
                var di = i - d2;
                var dj = j - d2;
                var hh = r - Math.sqrt(di * di + dj * dj);
                var Index = (i * d + d - j - 1) * 4;
                if (hh >= 0)
                {
                    var alpha = 255;

                    if (hh <= pixel)
                    {
                        var _hh = (pixel - hh) / pixel;
                        var shade = shadow;
                        if (di - dj < r / 3)
                            shade = 1;

                        alpha = parseInt((1 - _hh * shade ) * 255);
                    }
                    else if (hh <= 2 *pixel && hh >= pixel && true === this.m_bDarkBoard)
                    {
                        var _hh = (2 * pixel - hh) / (pixel);
                        var shade = shadow;
                        if (di - dj < r / 3)
                            shade = 1;
                        alpha = parseInt(_hh * shade * 255);
                    }

                    var bBorder = false;
                    if (hh <= 2 *pixel)
                    {
                        bBorder = true;
                    }

                    if (false === bBorder || false === this.m_bDarkBoard)
                    {
                        BlackBitmap[Index + 0] = this.m_oBlackColor.r;
                        BlackBitmap[Index + 1] = this.m_oBlackColor.g;
                        BlackBitmap[Index + 2] = this.m_oBlackColor.b;
                        BlackBitmap[Index + 3] = alpha;

                        BlackTBitmap[Index + 0] = this.m_oBlackColor.r;
                        BlackTBitmap[Index + 1] = this.m_oBlackColor.g;
                        BlackTBitmap[Index + 2] = this.m_oBlackColor.b;
                        BlackTBitmap[Index + 3] = parseInt(alpha * 0.5);
                    }
                    else
                    {
                        BlackBitmap[Index + 0] = this.m_oWhiteColor.r;
                        BlackBitmap[Index + 1] = this.m_oWhiteColor.g;
                        BlackBitmap[Index + 2] = this.m_oWhiteColor.b;
                        BlackBitmap[Index + 3] = alpha;

                        BlackTBitmap[Index + 0] = this.m_oWhiteColor.r;
                        BlackTBitmap[Index + 1] = this.m_oWhiteColor.g;
                        BlackTBitmap[Index + 2] = this.m_oWhiteColor.b;
                        BlackTBitmap[Index + 3] = parseInt(alpha * 0.5);
                    }

                    alpha = 255;
                    if (hh <= pixel)
                    {
                        var _hh = (pixel - hh) / pixel;
                        var shade = shadow;
                        if (di - dj < r / 3)
                            shade = 1;

                        alpha = parseInt((1 - _hh * shade ) * 255);
                    }
                    else if (hh <= 2 *pixel && hh >= pixel && false === this.m_bDarkBoard)
                    {
                        var _hh = (2 * pixel - hh) / (pixel);
                        var shade = shadow;
                        if (di - dj < r / 3)
                            shade = 1;
                        alpha = parseInt(_hh * shade * 255);
                    }

                    if (false === bBorder || true === this.m_bDarkBoard)
                    {
                        WhiteBitmap[Index + 0] = this.m_oWhiteColor.r;
                        WhiteBitmap[Index + 1] = this.m_oWhiteColor.g;
                        WhiteBitmap[Index + 2] = this.m_oWhiteColor.b;
                        WhiteBitmap[Index + 3] = alpha;

                        WhiteTBitmap[Index + 0] = this.m_oWhiteColor.r;
                        WhiteTBitmap[Index + 1] = this.m_oWhiteColor.g;
                        WhiteTBitmap[Index + 2] = this.m_oWhiteColor.b;
                        WhiteTBitmap[Index + 3] = parseInt(alpha / 2);
                    }
                    else
                    {
                        WhiteBitmap[Index + 0] = this.m_oBlackColor.r;
                        WhiteBitmap[Index + 1] = this.m_oBlackColor.g;
                        WhiteBitmap[Index + 2] = this.m_oBlackColor.b;
                        WhiteBitmap[Index + 3] = alpha;

                        WhiteTBitmap[Index + 0] = this.m_oBlackColor.r;
                        WhiteTBitmap[Index + 1] = this.m_oBlackColor.g;
                        WhiteTBitmap[Index + 2] = this.m_oBlackColor.b;
                        WhiteTBitmap[Index + 3] = parseInt(alpha / 2);
                    }
                }
                else
                {
                    BlackBitmap[Index + 0] = 0;
                    BlackBitmap[Index + 1] = 0;
                    BlackBitmap[Index + 2] = 0;
                    BlackBitmap[Index + 3] = 0;

                    BlackTBitmap[Index + 0] = 0;
                    BlackTBitmap[Index + 1] = 0;
                    BlackTBitmap[Index + 2] = 0;
                    BlackTBitmap[Index + 3] = 0;

                    WhiteBitmap[Index + 0] = 0;
                    WhiteBitmap[Index + 1] = 0;
                    WhiteBitmap[Index + 2] = 0;
                    WhiteBitmap[Index + 3] = 0;

                    WhiteTBitmap[Index + 0] = 0;
                    WhiteTBitmap[Index + 1] = 0;
                    WhiteTBitmap[Index + 2] = 0;
                    WhiteTBitmap[Index + 3] = 0;
                }
            }
        }
    }
};
CDrawingNavigator.prototype.private_CreateLines = function()
{
    var nTransAlpha = 96;

    var Canvas = this.HtmlElement.Lines.Control.HtmlElement.getContext("2d");

    this.m_oImageData.Hor_Start      = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_Start2     = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor            = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor2           = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_End        = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver            = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver2           = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver3           = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_Start_T    = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_Start2_T   = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_Start2_T_2 = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_Start2_T_3 = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_T          = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor2_T         = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor2_T_2       = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor2_T_3       = Canvas.createImageData(24, 24);
    this.m_oImageData.Hor_End_T      = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver_T          = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver2_T         = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver2_T_2       = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver2_T_3       = Canvas.createImageData(24, 24);
    this.m_oImageData.Ver3_T         = Canvas.createImageData(24, 24);

    var NHS_Bitmap      = this.m_oImageData.Hor_Start.data;
    var NHS2_Bitmap     = this.m_oImageData.Hor_Start2.data;
    var NH_Bitmap       = this.m_oImageData.Hor.data;
    var NH2_Bitmap      = this.m_oImageData.Hor2.data;
    var NHE_Bitmap      = this.m_oImageData.Hor_End.data;
    var NV_Bitmap       = this.m_oImageData.Ver.data;
    var NV2_Bitmap      = this.m_oImageData.Ver2.data;
    var NV3_Bitmap      = this.m_oImageData.Ver3.data;
    var NHS_Bitmap_T    = this.m_oImageData.Hor_Start_T.data;
    var NHS2_Bitmap_T   = this.m_oImageData.Hor_Start2_T.data;
    var NHS2_Bitmap_T_2 = this.m_oImageData.Hor_Start2_T_2.data;
    var NHS2_Bitmap_T_3 = this.m_oImageData.Hor_Start2_T_3.data;
    var NH_Bitmap_T     = this.m_oImageData.Hor_T.data;
    var NH2_Bitmap_T    = this.m_oImageData.Hor2_T.data;
    var NH2_Bitmap_T_2  = this.m_oImageData.Hor2_T_2.data;
    var NH2_Bitmap_T_3  = this.m_oImageData.Hor2_T_3.data;
    var NHE_Bitmap_T    = this.m_oImageData.Hor_End_T.data;
    var NV_Bitmap_T     = this.m_oImageData.Ver_T.data;
    var NV2_Bitmap_T    = this.m_oImageData.Ver2_T.data;
    var NV2_Bitmap_T_2  = this.m_oImageData.Ver2_T_2.data;
    var NV2_Bitmap_T_3  = this.m_oImageData.Ver2_T_3.data;
    var NV3_Bitmap_T    = this.m_oImageData.Ver3_T.data;

    var nChannel = true === this.m_bDarkBoard ? 200 : 28;

    var Color = new CColor(nChannel, nChannel, nChannel, 255);
    for ( var i = 0; i < 24; i++ )
    {
        for ( var j = 0; j < 24; j++ )
        {
            var Index = (i * 24 + j) * 4;

            // NHS
            if ( j >= 12 && ( 11 === i || 12 === i ) )
            {
                NHS_Bitmap[Index + 0] = Color.r;
                NHS_Bitmap[Index + 1] = Color.b;
                NHS_Bitmap[Index + 2] = Color.g;
                NHS_Bitmap[Index + 3] = 255;

                NHS_Bitmap_T[Index + 0] = Color.r;
                NHS_Bitmap_T[Index + 1] = Color.b;
                NHS_Bitmap_T[Index + 2] = Color.g;
                NHS_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
            {
                NHS_Bitmap[Index + 3] = 0;
                NHS_Bitmap_T[Index + 3] = 0;
            }

            // NHS2
            if ( ( j >= 11 && ( 11 === i || 12 === i ) ) || ( i >= 12 && ( 11 === j || 12 === j ) ) )
            {
                NHS2_Bitmap[Index + 0] = Color.r;
                NHS2_Bitmap[Index + 1] = Color.b;
                NHS2_Bitmap[Index + 2] = Color.g;
                NHS2_Bitmap[Index + 3] = 255;

                NHS2_Bitmap_T_3[Index + 0] = Color.r;
                NHS2_Bitmap_T_3[Index + 1] = Color.b;
                NHS2_Bitmap_T_3[Index + 2] = Color.g;
                NHS2_Bitmap_T_3[Index + 3] = nTransAlpha;
            }
            else
            {
                NHS2_Bitmap[Index + 3] = 0;
                NHS2_Bitmap_T_3[Index + 3] = 0;
            }

            if ( j >= 11 && ( 11 === i || 12 === i ) )
            {
                NHS2_Bitmap_T[Index + 0] = Color.r;
                NHS2_Bitmap_T[Index + 1] = Color.b;
                NHS2_Bitmap_T[Index + 2] = Color.g;
                NHS2_Bitmap_T[Index + 3] = 255;
            }
            else if ( i >= 12 && ( 11 === j || 12 === j ) )
            {
                NHS2_Bitmap_T[Index + 0] = Color.r;
                NHS2_Bitmap_T[Index + 1] = Color.b;
                NHS2_Bitmap_T[Index + 2] = Color.g;
                NHS2_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
                NHS2_Bitmap_T[Index + 3] = 0;


            if ( i >= 12 && ( 11 === j || 12 === j ) )
            {
                NHS2_Bitmap_T_2[Index + 0] = Color.r;
                NHS2_Bitmap_T_2[Index + 1] = Color.b;
                NHS2_Bitmap_T_2[Index + 2] = Color.g;
                NHS2_Bitmap_T_2[Index + 3] = 255;
            }
            else if ( j >= 11 && ( 11 === i || 12 === i ) )
            {
                NHS2_Bitmap_T_2[Index + 0] = Color.r;
                NHS2_Bitmap_T_2[Index + 1] = Color.b;
                NHS2_Bitmap_T_2[Index + 2] = Color.g;
                NHS2_Bitmap_T_2[Index + 3] = nTransAlpha;
            }
            else
                NHS2_Bitmap_T_2[Index + 3] = 0;

            // NH
            if ( 11 === i || 12 === i )
            {
                NH_Bitmap[Index + 0] = Color.r;
                NH_Bitmap[Index + 1] = Color.b;
                NH_Bitmap[Index + 2] = Color.g;
                NH_Bitmap[Index + 3] = 255;

                NH_Bitmap_T[Index + 0] = Color.r;
                NH_Bitmap_T[Index + 1] = Color.b;
                NH_Bitmap_T[Index + 2] = Color.g;
                NH_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
            {
                NH_Bitmap[Index + 3] = 0;
                NH_Bitmap_T[Index + 3] = 0;
            }

            // NH2
            if ( ( 11 === i || 12 === i ) || ( i >= 12 && ( 11 === j || 12 === j ) ) )
            {
                NH2_Bitmap[Index + 0] = Color.r;
                NH2_Bitmap[Index + 1] = Color.b;
                NH2_Bitmap[Index + 2] = Color.g;
                NH2_Bitmap[Index + 3] = 255;

                NH2_Bitmap_T_3[Index + 0] = Color.r;
                NH2_Bitmap_T_3[Index + 1] = Color.b;
                NH2_Bitmap_T_3[Index + 2] = Color.g;
                NH2_Bitmap_T_3[Index + 3] = nTransAlpha;
            }
            else
            {
                NH2_Bitmap[Index + 3] = 0;
                NH2_Bitmap_T_3[Index + 3] = 0;
            }

            if ( 11 === i || 12 === i )
            {
                NH2_Bitmap_T[Index + 0] = Color.r;
                NH2_Bitmap_T[Index + 1] = Color.b;
                NH2_Bitmap_T[Index + 2] = Color.g;
                NH2_Bitmap_T[Index + 3] = 255;
            }
            else if ( i >= 12 && ( 11 === j || 12 === j ) )
            {
                NH2_Bitmap_T[Index + 0] = Color.r;
                NH2_Bitmap_T[Index + 1] = Color.b;
                NH2_Bitmap_T[Index + 2] = Color.g;
                NH2_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
                NH2_Bitmap_T[Index + 3] = 0;

            if ( ( ( 11 === i || 12 === i ) && j <= 12 ) || ( i >= 12 && ( 11 === j || 12 === j ) ) )
            {
                NH2_Bitmap_T_2[Index + 0] = Color.r;
                NH2_Bitmap_T_2[Index + 1] = Color.b;
                NH2_Bitmap_T_2[Index + 2] = Color.g;
                NH2_Bitmap_T_2[Index + 3] = 255;
            }
            else if ( ( 11 === i || 12 === i ) && j > 12 )
            {
                NH2_Bitmap_T_2[Index + 0] = Color.r;
                NH2_Bitmap_T_2[Index + 1] = Color.b;
                NH2_Bitmap_T_2[Index + 2] = Color.g;
                NH2_Bitmap_T_2[Index + 3] = nTransAlpha;
            }
            else
            {
                NH2_Bitmap[Index + 3] = 0;
                NH2_Bitmap_T_3[Index + 3] = 0;
            }

            // NHE
            if ( j <= 11 && ( 11 === i || 12 === i ) )
            {
                NHE_Bitmap[Index + 0] = Color.r;
                NHE_Bitmap[Index + 1] = Color.b;
                NHE_Bitmap[Index + 2] = Color.g;
                NHE_Bitmap[Index + 3] = 255;

                NHE_Bitmap_T[Index + 0] = Color.r;
                NHE_Bitmap_T[Index + 1] = Color.b;
                NHE_Bitmap_T[Index + 2] = Color.g;
                NHE_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
            {
                NHE_Bitmap[Index + 3] = 0;
                NHE_Bitmap_T[Index + 3] = 0;
            }

            // NV
            if ( 11 === j || 12 === j )
            {
                NV_Bitmap[Index + 0] = Color.r;
                NV_Bitmap[Index + 1] = Color.b;
                NV_Bitmap[Index + 2] = Color.g;
                NV_Bitmap[Index + 3] = 255;

                NV_Bitmap_T[Index + 0] = Color.r;
                NV_Bitmap_T[Index + 1] = Color.b;
                NV_Bitmap_T[Index + 2] = Color.g;
                NV_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
            {
                NV_Bitmap[Index + 3] = 0;
                NV_Bitmap_T[Index + 3] = 0;
            }

            // NV2
            if ( ( 11 === j || 12 === j ) || ( j >= 12 && ( 11 === i || 12 === i ) ) )
            {
                NV2_Bitmap[Index + 0] = Color.r;
                NV2_Bitmap[Index + 1] = Color.b;
                NV2_Bitmap[Index + 2] = Color.g;
                NV2_Bitmap[Index + 3] = 255;

                NV2_Bitmap_T_3[Index + 0] = Color.r;
                NV2_Bitmap_T_3[Index + 1] = Color.b;
                NV2_Bitmap_T_3[Index + 2] = Color.g;
                NV2_Bitmap_T_3[Index + 3] = nTransAlpha;
            }
            else
            {
                NV2_Bitmap[Index + 3] = 0;
                NV2_Bitmap_T_3[Index + 3] = 0;
            }

            if ( ( ( 11 === j || 12 === j ) && i <= 12 ) || ( j >= 12 && ( 11 === i || 12 === i ) ) )
            {
                NV2_Bitmap_T[Index + 0] = Color.r;
                NV2_Bitmap_T[Index + 1] = Color.b;
                NV2_Bitmap_T[Index + 2] = Color.g;
                NV2_Bitmap_T[Index + 3] = 255;
            }
            else if ( ( 11 === j || 12 === j ) && i > 12 )
            {
                NV2_Bitmap_T[Index + 0] = Color.r;
                NV2_Bitmap_T[Index + 1] = Color.b;
                NV2_Bitmap_T[Index + 2] = Color.g;
                NV2_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
                NV2_Bitmap_T[Index + 3] = 0;

            if ( 11 === j || 12 === j )
            {
                NV2_Bitmap_T_2[Index + 0] = Color.r;
                NV2_Bitmap_T_2[Index + 1] = Color.b;
                NV2_Bitmap_T_2[Index + 2] = Color.g;
                NV2_Bitmap_T_2[Index + 3] = 255;
            }
            else if ( j > 12 && ( 11 === i || 12 === i ) )
            {
                NV2_Bitmap_T_2[Index + 0] = Color.r;
                NV2_Bitmap_T_2[Index + 1] = Color.b;
                NV2_Bitmap_T_2[Index + 2] = Color.g;
                NV2_Bitmap_T_2[Index + 3] = nTransAlpha;
            }
            else
                NV2_Bitmap_T_2[Index + 3] = 0;

            // NV3
            if ( ( i <= 11 && ( 11 === j || 12 === j ) ) || ( j >= 11 && ( 11 === i || 12 === i ) ) )
            {
                NV3_Bitmap[Index + 0] = Color.r;
                NV3_Bitmap[Index + 1] = Color.b;
                NV3_Bitmap[Index + 2] = Color.g;
                NV3_Bitmap[Index + 3] = 255;

                NV3_Bitmap_T[Index + 0] = Color.r;
                NV3_Bitmap_T[Index + 1] = Color.b;
                NV3_Bitmap_T[Index + 2] = Color.g;
                NV3_Bitmap_T[Index + 3] = nTransAlpha;
            }
            else
            {
                NV3_Bitmap[Index + 3] = 0;
                NV3_Bitmap_T[Index + 3] = 0;
            }
        }
    }

    this.m_oImageData.Triangle    = this.private_DrawTriangle(20, 20, 20 * 0.07, Color, 1, null);
    this.m_oImageData.Triangle_T  = this.private_DrawTriangle(20, 20, 20 * 0.07, new CColor(nChannel, nChannel, nChannel, nTransAlpha), 1, null);
    this.m_oImageData.Triangle_B  = this.private_DrawTriangle(20, 20, 20 * 0.06, new CColor(255, 255, 255, 255), 1, this.m_oImageData.Black);
    this.m_oImageData.Triangle_W  = this.private_DrawTriangle(20, 20, 20 * 0.06, new CColor(0, 0, 0, 255), 1, this.m_oImageData.White);
    this.m_oImageData.Triangle_BT = this.private_DrawTriangle(20, 20, 20 * 0.06, new CColor(255, 255, 255, nTransAlpha), 1, this.m_oImageData.BlackT);
    this.m_oImageData.Triangle_WT = this.private_DrawTriangle(20, 20, 20 * 0.06, new CColor(0, 0, 0, nTransAlpha), 1, this.m_oImageData.WhiteT);
};
CDrawingNavigator.prototype.private_CreateTarget = function()
{
    var Size = 24;
    var Canvas = this.HtmlElement.Selection.Control.HtmlElement.getContext("2d");

    this.m_oImageData.Target  = Canvas.createImageData(Size, Size);
    this.m_oImageData.Current = Canvas.createImageData(Size, Size);
    var TargetBitmap  = this.m_oImageData.Target.data;
    var CurrentBitmap = this.m_oImageData.Current.data;

    for (var Y = 0; Y < Size; Y++)
    {
        for (var X = 0; X < Size; X++)
        {
            var Index = (X + Y * Size) * 4;

            TargetBitmap[Index + 3] = 255;
            CurrentBitmap[Index + 3] = 255;
            if ((0 === X && Size - 1 === Y) || (Size - 1 === X && 0 === Y))
            {
                TargetBitmap[Index + 0] = 135;
                TargetBitmap[Index + 1] = 125;
                TargetBitmap[Index + 2] = 135;

                CurrentBitmap[Index + 0] = 216;
                CurrentBitmap[Index + 1] = 0;
                CurrentBitmap[Index + 2] = 0;
            }
            else if (Size - 1 === X || Size - 1 === Y)
            {
                TargetBitmap[Index + 0] = 89;
                TargetBitmap[Index + 1] = 89;
                TargetBitmap[Index + 2] = 89;

                CurrentBitmap[Index + 0] = 178;
                CurrentBitmap[Index + 1] = 0;
                CurrentBitmap[Index + 2] = 0;
            }
            else if (0 === Y || 0 === X)
            {
                TargetBitmap[Index + 0] = 182;
                TargetBitmap[Index + 1] = 182;
                TargetBitmap[Index + 2] = 182;

                CurrentBitmap[Index + 0] = 255;
                CurrentBitmap[Index + 1] = 0;
                CurrentBitmap[Index + 2] = 0;
            }
            else
            {
                TargetBitmap[Index + 0] = 128;
                TargetBitmap[Index + 1] = 128;
                TargetBitmap[Index + 2] = 128;

                CurrentBitmap[Index + 0] = 255;
                CurrentBitmap[Index + 1] = 0;
                CurrentBitmap[Index + 2] = 0;
            }
        }
    }

    Canvas.putImageData(this.m_oImageData.Target, 0, 0);
    Canvas.putImageData(this.m_oImageData.Current, 0, 30);
};
CDrawingNavigator.prototype.private_DrawTriangle = function(W, H, PenWidth, Color, Alpha, oStoneImageData)
{
    if (undefined === Alpha)
        Alpha = 1;

    var Canvas = this.HtmlElement.Lines.Control.HtmlElement.getContext("2d");
    Canvas.clearRect(0, 0, W, H);

    if (null !== oStoneImageData)
        Canvas.putImageData(oStoneImageData, 0, 0);

    Canvas.globalAlpha = Alpha;
    Canvas.strokeStyle = Color.ToString();
    Canvas.fillStyle   = Color.ToString();
    Canvas.lineWidth   = PenWidth;

    var r     = W / 2;
    var _y    = H * 3 / 4;
    var shift = W * 0.1;

    var _x1 =  Math.sqrt(r * r - (_y - r) * (_y - r)) + r;
    var _x2 = -Math.sqrt(r * r - (_y - r) * (_y - r)) + r;

    var x1 = _x1 - shift;
    var x2 = _x2 + shift;
    var y1 = shift;
    var y2 = _y;

    if (null !== oStoneImageData)
    {
        x1 = Math.floor(x1 - 0.5);
        x2 = Math.ceil(x2 + 0.5);
        y1 = Math.ceil(y1 + 0.5);
        y2 = Math.floor(y2 - 0.5);
    }


    Canvas.beginPath();
    Canvas.moveTo(W / 2, y1);
    Canvas.lineTo(x1, y2);
    Canvas.lineTo(x2, y2);
    Canvas.closePath();
    Canvas.stroke();

    var data = Canvas.getImageData(0, 0, W, H);

    Canvas.putImageData(data, 0, 0);
    return data;
};
CDrawingNavigator.prototype.private_CreateShadows = function()
{
    var ShadowCanvas = this.HtmlElement.Shadows.Control.HtmlElement.getContext("2d");
    var d = 20;
    this.m_oImageData.Shadow = ShadowCanvas.createImageData(d, d);
    var Shadow = this.m_oImageData.Shadow.data;
    this.m_oImageData.ShadowOff = Math.max(parseInt(d * 0.15), 3);

    var r = (d - 5) / 2 + 1;
    for (var i = 0; i < d; i++)
    {
        for (var j = 0; j < d; j++)
        {
            var y = Math.abs(i - r);
            var x = Math.abs(j - r);
            var dist = Math.sqrt(x * x + y * y) / r;

            var f = ( dist < 1.0 ? 0.15 + 0.75 * ( 1 - dist ) : 0 );

            var Index = (d * i + j) * 4;
            Shadow[Index + 0] = 0;
            Shadow[Index + 1] = 0;
            Shadow[Index + 2] = 0;
            Shadow[Index + 3] = parseInt( 255 * f );
        }
    }
};
CDrawingNavigator.prototype.private_DrawMap = function()
{
    this.m_bNeedRedrawMap = true;
    this.Update_Current(false);
};
CDrawingNavigator.prototype.private_UpdateMousePos = function(X, Y)
{
    var oPos = Common_FindPosition(this.HtmlElement.Board.Control.HtmlElement);
    var _X = ((X - oPos.X - 10 - this.m_oOffset.X) / 24) | 0;
    var _Y = ((Y - oPos.Y - 10 - this.m_oOffset.Y) / 24) | 0;
    return {X : _X, Y : _Y};
};
CDrawingNavigator.prototype.private_UpdateTarget = function(X, Y)
{
    var W = this.m_oImageData.W;
    var H = this.m_oImageData.H;

    if (W <= 0 || H <= 0)
        return;

    var Canvas = this.HtmlElement.Selection.Control.HtmlElement.getContext("2d");
    Canvas.clearRect(0, 0, W, H);
    if (X >= 0 && Y >= 0)
    {
        var RealX = 10 + this.m_oOffset.X + X * 24;
        var RealY = 10 + this.m_oOffset.Y + Y * 24;

        var Value = this.m_oMap.Get(X, Y);
        if (Value.Is_Node())
            Canvas.putImageData(this.m_oImageData.Target, RealX, RealY);
    }
};
CDrawingNavigator.prototype.private_UpdateScrollsPos = function()
{
    var XOffset   = -this.m_oOffset.X;
    var LogicXMax =  this.m_oMap.Get_Width() + 1;
    var ScrollW   =  this.HtmlElement.ScrollW;
    var NavW      =  this.m_oImageData.W;

    var X = XOffset / (20 + LogicXMax * 24 - NavW) * (NavW - 4 - ScrollW) + 2;

    var YOffset   = -this.m_oOffset.Y;
    var LogicYMax =  this.m_oMap.Get_Height() + 1;
    var ScrollH   =  this.HtmlElement.ScrollH;
    var NavH      =  this.m_oImageData.H;

    var Y = YOffset / (20 + LogicYMax * 24 - NavH) * (NavH - 4 - ScrollH) + 2;

    this.HtmlElement.HorScroll.style.left = X + "px";
    this.HtmlElement.VerScroll.style.top  = Y + "px";
};
CDrawingNavigator.prototype.private_DrawMapOnTimer = function()
{
    var W = this.m_oImageData.W;
    var H = this.m_oImageData.H;

    if (0 === W || 0 === H)
        return;

    if (this.m_oLastDrawMap.W === W && this.m_oLastDrawMap.H === H && Math.abs(this.m_oOffset.X - this.m_oLastDrawMap.X) < 1 && Math.abs(this.m_oOffset.Y - this.m_oLastDrawMap.Y) < 1)
    {
        this.m_bNeedRedrawMap = false;
        return;
    }

    this.m_oLastDrawMap.W = W;
    this.m_oLastDrawMap.H = H;
    this.m_oLastDrawMap.X = this.m_oOffset.X;
    this.m_oLastDrawMap.Y = this.m_oOffset.Y;

    var Lines     = this.HtmlElement.Lines.Control.HtmlElement.getContext("2d");
    var Shadows   = this.HtmlElement.Shadows.Control.HtmlElement.getContext("2d");
    var Nodes     = this.HtmlElement.Nodes.Control.HtmlElement.getContext("2d");
    var Selection = this.HtmlElement.Selection.Control.HtmlElement.getContext("2d");
    Nodes.clearRect(0, 0, W, H);
    Shadows.clearRect(0, 0, W, H);
    Lines.clearRect(0, 0, W, H);
    Selection.clearRect(0, 0, W, H);

    var x = 10 + this.m_oOffset.X;
    var y = 10 + this.m_oOffset.Y;

    var Height = this.m_oMap.Get_Height();

    for (var Y = 0; Y <= Height - 1 ; Y++)
    {
        var _y = y + 24 * Y;

        // Отрисовываем только те строки, которые попадают в поле видимости
        if (_y >= -24 && _y <= H + 24)
        {
            var Width = this.m_oMap.Get_LineWidth(Y);
            for (var X = 0; X <= Width; X++)
            {
                var _x = x + 24 * X;

                // Отрисовываем только те столбцы, которые попадают в поле видимости
                if (_x  >= -24 && _x <= W + 24)
                {
                    var Value = this.m_oMap.Get(X, Y);
                    if (false === Value.Is_Node())
                    {
                        var nType   = Value.Get_Type();
                        var oResult = Value.Is_OnCurrentVariant();

                        switch(nType)
                        {
                            case ENavigatorElementType.Empty:
                            {
                                break;
                            }
                            case ENavigatorElementType.Line_Ver:
                            {
                                if (!oResult.bResult)
                                    Lines.putImageData(this.m_oImageData.Ver_T, _x, _y);
                                else
                                    Lines.putImageData(this.m_oImageData.Ver, _x, _y);

                                break;
                            }
                            case ENavigatorElementType.Line_Ver_Con:
                            {
                                if (oResult.bResult)
                                {
                                    if (1 === oResult.Temp)
                                        Lines.putImageData(this.m_oImageData.Ver2_T, _x, _y);
                                    else
                                        Lines.putImageData(this.m_oImageData.Ver2_T_2, _x, _y);
                                }
                                else
                                    Lines.putImageData(this.m_oImageData.Ver2_T_3, _x, _y);

                                break;
                            }
                            case ENavigatorElementType.Line_Ver_End:
                            {
                                if ( !oResult.bResult )
                                    Lines.putImageData(this.m_oImageData.Ver3_T, _x, _y);
                                else
                                    Lines.putImageData(this.m_oImageData.Ver3, _x, _y);
                            }
                        }
                    }
                    else
                    {
                        var bCurVariant = Value.Is_OnCurrentVariant();

                        // Value - нода
                        var oMove = Value.Get_Move();
                        var nMoveType = oMove.Get_Type();
                        var sMove = "" +  Value.Get_NavigatorInfo().Num;
                        var nTextW = Nodes.measureText(sMove).width;
                        var sComment = Value.Get_Comment();

                        if (BOARD_BLACK === nMoveType)
                        {
                            if (bCurVariant && true === this.m_bShadows)
                                Shadows.putImageData(this.m_oImageData.Shadow, _x + 2 + this.m_oImageData.ShadowOff, _y + 2 + this.m_oImageData.ShadowOff);

                            Nodes.putImageData((bCurVariant ?  this.m_oImageData.Black : this.m_oImageData.BlackT) , _x + 2, _y + 2);

                            if ("" === sComment)
                            {
                                Nodes.font = "bold 10px sans-serif";
                                Nodes.fillStyle = ( bCurVariant ?  "#CCC" : "rgb(192, 192, 192)" );
                                Nodes.fillText( sMove, _x + 12 - nTextW / 2, _y + 24 / 2 + 3 );
                            }
                            else
                            {
                                Nodes.putImageData((bCurVariant ?  this.m_oImageData.Triangle_B : this.m_oImageData.Triangle_BT) , _x + 2, _y + 2);
                            }
                        }
                        else if (BOARD_WHITE === nMoveType)
                        {
                            if (bCurVariant && true === this.m_bShadows)
                                Shadows.putImageData(this.m_oImageData.Shadow, _x + 2 + this.m_oImageData.ShadowOff, _y + 2 + this.m_oImageData.ShadowOff);

                            Nodes.putImageData((bCurVariant ? this.m_oImageData.White : this.m_oImageData.WhiteT), _x + 2, _y + 2);

                            if ("" === sComment)
                            {
                                Nodes.font = "bold 10px sans-serif";
                                Nodes.fillStyle = ( bCurVariant ?  "#000" : "rgb(56, 56, 56)" );;
                                Nodes.fillText( sMove, _x + 12 - nTextW / 2, _y + 24 / 2 + 3 );
                            }
                            else
                            {
                                Nodes.putImageData((bCurVariant ?  this.m_oImageData.Triangle_W : this.m_oImageData.Triangle_WT) , _x + 2, _y + 2);
                            }
                        }
                        else // if (BOARD_EMPTY === nMoveType)
                        {
                            Nodes.putImageData((bCurVariant ? this.m_oImageData.Triangle : this.m_oImageData.Triangle_T),  _x + 2, _y + 2);
                        }

                        var NextsCount = Value.Get_NextsCount();
                        var NextCur = Value.Get_NextCur();
                        if (0 === X)
                        {
                            if (0 === NextsCount)
                            {}
                            else if (1 === NextsCount)
                            {
                                if (bCurVariant)
                                    Lines.putImageData(this.m_oImageData.Hor_Start, _x, _y);
                                else
                                    Lines.putImageData(this.m_oImageData.Hor_Start_T, _x, _y);
                            }
                            else
                            {
                                if (bCurVariant)
                                {
                                    if (0 == NextCur)
                                        Lines.putImageData(this.m_oImageData.Hor_Start2_T, _x, _y);
                                    else
                                        Lines.putImageData(this.m_oImageData.Hor_Start2_T_2, _x, _y);
                                }
                                else
                                    Lines.putImageData(this.m_oImageData.Hor_Start2_T_3, _x, _y);
                            }
                        }
                        else
                        {
                            if (0 === NextsCount)
                            {
                                if (bCurVariant)
                                    Lines.putImageData(this.m_oImageData.Hor_End, _x, _y);
                                else
                                    Lines.putImageData(this.m_oImageData.Hor_End_T, _x, _y);
                            }
                            else if (1 === NextsCount)
                            {
                                if (bCurVariant)
                                    Lines.putImageData(this.m_oImageData.Hor, _x, _y);
                                else
                                    Lines.putImageData(this.m_oImageData.Hor_T, _x, _y);
                            }
                            else
                            {
                                if (bCurVariant)
                                {
                                    if (0 === NextCur)
                                        Lines.putImageData(this.m_oImageData.Hor2_T, _x, _y);
                                    else
                                        Lines.putImageData(this.m_oImageData.Hor2_T_2, _x, _y);
                                }
                                else
                                    Lines.putImageData(this.m_oImageData.Hor2_T_3, _x, _y);
                            }
                        }

                        // TODO: Это можно заменить дополнительно созданными картинками с вырезынными частями.
                        if (BOARD_BLACK === nMoveType || BOARD_WHITE === nMoveType)
                            Lines.clearRect(_x + 3, _y + 3, 18, 18);
                    }
                }
            }
        }
    }

    this.m_bNeedRedrawMap = false;
};
CDrawingNavigator.prototype.private_DrawCurrentOnTimer = function()
{
    if (!this.m_oGameTree)
        return;

    var W = this.m_oImageData.W;
    var H = this.m_oImageData.H;

    if (W <= 0 || H <= 0)
        return;

    var oCurNodePos = this.m_oGameTree.Get_CurNode().Get_NavigatorInfo();
    var X = oCurNodePos.X, Y = oCurNodePos.Y;

    var RealX = 10 + this.m_oOffset.X + X * 24;
    var RealY = 10 + this.m_oOffset.Y + Y * 24;

    var Canvas = this.HtmlElement.Current.Control.HtmlElement.getContext("2d");
    Canvas.clearRect(0, 0, W, H);

    if (RealX  >= -24 && RealX <= W + 24 && RealY >= -24 && RealY <= H + 24)
    {
        Canvas.putImageData(this.m_oImageData.Current, RealX, RealY);
    }

    this.m_bNeedRedrawCurrent = false;
};