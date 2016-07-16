<?php

namespace App\Http\Controllers;

use App\Http\Requests\MenuRequest;
use App\Menu;
use Illuminate\Http\Request;

use App\Http\Requests;

class MenusController extends DashboardController
{
    public function index()
    {
        $menus = Menu::paginate();
        return view('dashboard.menu.index', compact('menus'));
    }

    public function create()
    {
        return view('dashboard.menu.create');
    }

    public function store(MenuRequest $request)
    {

        $menu = Menu::create($request->all());

        $menu->pages()->sync($request->input('pages') ?: []);

        return redirect()->route('all_menu');
    }

    public function edit(Menu $menu)
    {
        return view('dashboard.menu.edit', compact('menu'));
    }

    public function update(Menu $menu, MenuRequest $request)
    {
        $menu->update($request->all());

        $menu->pages()->sync($request->input('pages') ?: []);

        return redirect()->route('all_menu');
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();

        return redirect()->route('all_menu');
    }

    public function sort(Menu $menu)
    {
        return view('dashboard.menu.sort', compact('menu'));
    }

    public function sorting(Menu $menu, Request $request)
    {
        $menu->sorting($request->input('pages'));
        return redirect()->route('all_menu');
    }
}
