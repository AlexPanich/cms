@extends('layouts.dashboard')

@section('title')
    Редактирование меню
@endsection

@section('content')
    <h1>Редактирование меню</h1>
    @include('errors.list')
    <form class="" action="{{ route('update_menu', $menu->id) }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="title">Название меню</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ old('title', $menu->title) }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="pages">Добавить страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <select name="pages[]" id="pages" multiple>
                        @menu_tree($tree, $menu)
                    </select>
                </div>
            </div>
        </div>
        <input type="submit" value="Обновить меню меню" class="btn btn-danger">
    </form>
@endsection