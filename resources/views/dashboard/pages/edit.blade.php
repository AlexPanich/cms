@extends('layouts.dashboard')

@inject('menu', 'App\Menu')

@section('page_title')
    Страницы
@endsection

@section('content_title')
    Редактирование страницы
@endsection

@include('dashboard.editor')

@section('style2')
    <style>
        .sorting li {
            cursor: pointer;
        }
    </style>
@endsection

@section('scripts.footer2')
    <script src="{{ URL::to('js/jquery-ui.min.js') }}"></script>
    <script>
        $(document).ready(function() {
            $('.sorting').sortable();

            $('.form-sorting input[name=sub]').click(function(e) {
                e.preventDefault();
                var pages = [];

                $('.sorting li').each(function() {
                    pages.push($(this).attr('id_page'));
                });

                $('input[name=pages]').val(pages.toString());

                $('.form-sorting').submit();
            });
        });
    </script>
@endsection

@section('content')
    @include('errors.list')
    <form class="form-sorting" action="{{ route('update_page', $page->id) }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label for="parent_id" class="control-label">Раздел</label>
            <div class="controls">
                <select class="form-control " name="parent_id" id="parent_id">
                    <option value="0">Без раздела</option>
                    @tree($tree, $page->parent_id)
                </select>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="url">Адрес страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="url" id="url" value="{{ $page->url }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title_in_menu">Заголовок в меню</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title_in_menu" id="title_in_menu" value="{{ $page->title_in_menu }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="title">Заголовок страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="title" id="title" value="{{ $page->title  }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="keywords">Ключевые слова</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="keywords" id="keywords" value="{{ $page->keywords }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="description">Описание страницы</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="description" id="description" value="{{ $page->description }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label for="menu_id" class="control-label">Меню</label>
            <div class="controls">
                <select class="form-control " name="menu_id" id="menu_id">
                    <option value="0">Иерархическое</option>
                    @foreach($menu->all() as $item)
                        <option value="{{ $item->id }}"
                                @if($item->id == $page->menu_id)
                                selected
                                @endif
                        >{{ $item->title }}</option>
                    @endforeach
                </select>
            </div>
        </div>
        <br>
        <textarea class="form-control" name="content" id="replace" rows="10">{!! $page->content !!}</textarea>
        <br>
        <p>
            <label class="css-input switch switch-sm switch-primary">
                <input type="checkbox" name="is_show" {{ count($errors) == 0 || old('is_show') ? 'checked' : '' }}>
                <span></span>
                Отображать на сайте
            </label>
        </p>
        <h4>Сортировка дочерних разделов</h4>
        <div class="row">
            <ul class="sorting list-group col-md-6">
                @foreach($children as $child)
                    <li class="list-group-item" id_page="{{ $child->id }}">{{ $child->title_in_menu }}</li>
                @endforeach
            </ul>
        </div>
        <input type="hidden" name="pages" value="">
        <p>
            <input type="submit" value="Отредактировать страницу" class="btn btn-primary btn-square" name="sub">
            <a class="btn btn-default btn-square" href="{{ route('all_pages') }}">Все страницы (уйти не сохранив)</a>
        </p>
    </form>
@endsection