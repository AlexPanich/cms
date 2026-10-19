@extends('layouts.dashboard');

@section('page_title')
    Меню
@endsection

@section('content_title')
    Сортировка меню
@endsection

@section('style')
    <style>
        .sorting li {
            cursor: pointer;
        }
    </style>
@endsection

@section('scripts.footer')
    <script src="{{ URL::to('js/jquery-ui.min.js') }}"></script>
    <script>
        $(document).ready(function() {
            $('.sorting').sortable();

            $('.form-sorting input[name=sub]').click(function(e) {
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
    <div>{{ $menu->title }}</div>
    <br>
    <ul class="sorting list-group">
    @foreach($menu->withPages() as $item)
        <li class="list-group-item" id_page="{{ $item->id }}">{{ $item->title }}</li>
    @endforeach
    </ul>
    <form class="form-sorting" action="{{ route('sorting_menu', $menu->id) }}" method="post">
        {{ csrf_field() }}
        <input type="hidden" name="pages" value="">
        <p>
            <input class="btn btn-primary btn-square" type="button" name="sub" value="Сортировать меню">
            <a class="btn btn-default btn-square" href="{{ route('all_menu') }}">Все меню (уйти не сохранив)</a>
        </p>
    </form>
@endsection